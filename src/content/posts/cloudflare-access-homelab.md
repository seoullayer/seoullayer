---

## title: “Adding Cloudflare Access to a Homelab: The Gap Between Plan and Reality”
description: “How I set up Cloudflare Access to add authentication before my services, the Google OAuth traps that wasted hours, and why only one service ended up behind it.”
pubDatetime: 2026-05-27T00:00:00Z
tags: [“homelab”, “proxmox”, “self-hosting”, “cloudflare-tunnel”, “security”, “cloudflare-access”]
featured: false
draft: false
——-

## Introduction

In the Cloudflare Tunnel post, I ended with a note about Cloudflare Access. The idea was straightforward: add an authentication layer in front of my services so that visitors would need to verify their identity before reaching the login page. An email verification step before Home Assistant, for example. Whether the added friction was worth it for services that already had their own authentication was something I wanted to evaluate.

I evaluated it. The answer was more complicated than I expected.

Cloudflare Access works exactly as advertised. A Google login screen appears before the service loads, and only approved users can get through. The setup is not difficult once you know where the traps are. But the gap between “this works in a browser” and “this works with every app on every device” turned out to be the gap that shaped my entire approach.

This post covers the setup process, two specific problems that cost me significant time, and the honest conclusion about which services actually belong behind Access in a homelab.

-----

## What Cloudflare Access Actually Does

Cloudflare Tunnel creates a secure path from the internet to your services without opening ports. But anyone who knows the URL can still reach the service’s login page. The service’s own authentication is the only barrier.

Cloudflare Access adds a second barrier in front of that. Before a request even reaches your service, Cloudflare checks whether the user has authenticated through an identity provider you trust. If they have not, they see a login page hosted by Cloudflare. If they have, the request passes through to the service normally.

The practical effect is that your Home Assistant login page, your Nextcloud login page, or your Vaultwarden vault is invisible to anyone who has not first proven their identity through Google, GitHub, or another provider you configure. Even if someone discovers your service URL, they cannot interact with the application at all without passing Access first.

For a homelab where services are exposed to the internet through Cloudflare Tunnel, this sounds like an obvious improvement. And it is — with one significant limitation that I did not fully appreciate until I tried to use it.

-----

## Setting Up Google as an Identity Provider

Cloudflare Access supports multiple identity providers. I chose Google because I already use a Google account daily, and it requires no additional apps or hardware.

The setup involves two sides: creating OAuth credentials in Google Cloud Console, and connecting those credentials to Cloudflare Zero Trust.

### Google Cloud Console

The Google Cloud side requires creating a project, configuring an OAuth consent screen, and generating client credentials. The process is standard OAuth setup, but there are two steps that are easy to miss.

First, when configuring the OAuth consent screen, Google asks for basic information: app name, support email, and developer contact. These can be anything reasonable. The important part comes on the Scopes page. You need to add three scopes manually:

- `openid`
- `.../auth/userinfo.email`
- `.../auth/userinfo.profile`

Without these scopes, Cloudflare cannot retrieve the user’s email address during authentication. The login will appear to work — Google shows its normal consent screen — but Cloudflare will reject the response because it did not receive the email claim it expects. The error message does not clearly indicate that missing scopes are the problem, which makes this easy to spend a long time debugging.

Second, when creating the OAuth client ID, the Authorized redirect URI must be set to:

```
https://<your-team-name>.cloudflareaccess.com/cdn-cgi/access/callback
```

In my case, this was `https://seoullayer.cloudflareaccess.com/cdn-cgi/access/callback`. This is where Google sends the user after authentication, and Cloudflare will not accept the callback if the URI does not match exactly.

### Cloudflare Zero Trust

On the Cloudflare side, the identity provider configuration is under Integrations → Identity providers. Select Google, enter the Client ID and Client Secret from Google Cloud Console, and save.

There is one field that caused me significant trouble: **Email claim**.

The Email claim field asks for the claim name in the identity token that contains the user’s email. The default behavior, when this field is left empty, works correctly for Google. Cloudflare knows where to find the email in Google’s standard token format.

I made the mistake of entering my actual email address into this field, thinking it was asking which email to use for authentication. It is not. It is asking for the name of the JWT claim, not a value. With my email address in that field, every login attempt failed with an error saying the email could not be retrieved from the identity provider. The error pointed toward Google’s configuration, so I spent time rechecking scopes and redirect URIs before realizing the problem was on the Cloudflare side.

The fix was simply clearing the Email claim field and leaving it empty. Authentication worked immediately after that.

-----

## Creating an Access Application

With Google connected as an identity provider, the next step is creating an Access Application for each service you want to protect. This is done under Access controls → Applications in the Zero Trust dashboard.

For each application, you specify:

- The subdomain that the service uses (matching your Cloudflare Tunnel route)
- A policy that defines who is allowed through

The policy is where you control access. For a personal homelab, the simplest approach is an Allow policy with an email selector, limiting access to your own email address. Anyone who authenticates with Google but uses a different email address will be blocked.

The setup is straightforward and took only a few minutes per service. The real complexity came after.

-----

## The App Problem

I initially planned to put Access in front of every service exposed through Cloudflare Tunnel: Home Assistant, Nextcloud, Vaultwarden, Open WebUI, and Immich.

The browser experience was perfect. Navigate to any service URL, Google login appears, authenticate, and the service loads behind it. Clean, seamless, and exactly what I wanted.

Then I tried to connect from the mobile apps.

The Home Assistant app on my phone could not reach the server. The Nextcloud desktop client failed to sync. The Vaultwarden app could not retrieve my password vault.

The reason is fundamental to how Cloudflare Access works. Access uses browser-based authentication. When you visit a URL, it redirects you to a Google login page, you authenticate in the browser, and a session cookie is set. Mobile apps and desktop clients do not go through this flow. They make direct API calls to the service URL, and Cloudflare Access blocks those calls because there is no authenticated session.

This is not a bug or a misconfiguration. It is a design characteristic. Cloudflare Access is built for browser-based access to web applications. Native apps that communicate through APIs need a different approach.

There are workarounds. Cloudflare offers Service Tokens that can be embedded in HTTP headers, allowing API clients to bypass browser-based authentication. But most consumer apps, the ones you install from the App Store to access your homelab, do not support custom HTTP headers. You cannot configure the Home Assistant app to send a Cloudflare Service Token with every request.

This single limitation reshaped my entire Access strategy.

-----

## The Realistic Split

The question changed from “which services should I protect with Access” to “which services do I only access through a browser.”

Going through my usage patterns, the answer was clear:

**Home Assistant** — I use the mobile app constantly. Quick glances at sensor readings, triggering automations, checking camera feeds. Requiring a browser login every time would defeat the purpose of having a smart home app. Access is not practical here.

**Nextcloud** — The desktop sync client runs continuously in the background. The mobile app handles photo uploads and file access. Both are API-based. Access would break the core functionality.

**Vaultwarden** — The Bitwarden app and browser extension need constant API access to autofill passwords. Putting Access in front of Vaultwarden would make the password manager unusable for its primary purpose.

**Immich** — The mobile app handles automatic photo backup. Same API limitation applies.

**Open WebUI** — This is the one service I access exclusively through a web browser. I open it when I want to chat with a local LLM, use it in the browser, and close the tab. There is no native app involved. Cloudflare Access fits perfectly here.

The final configuration:

- **Cloudflare Tunnel + Access:** Open WebUI
- **Cloudflare Tunnel only:** Home Assistant, Nextcloud, Vaultwarden, Immich
- **VPN only:** Proxmox, Homepage, Grafana, AdGuard Home, Jellyfin

One service behind Access. Out of the five I originally planned to protect.

-----

## Was It Worth It?

Honestly, protecting a single service with Access feels disproportionate to the setup effort. Configuring Google Cloud OAuth, debugging scope issues, figuring out the Email claim trap, and navigating the Cloudflare Zero Trust dashboard — all of that for one service.

But I think the value is not just in the immediate result.

First, the setup is done. If I add more browser-only services in the future, putting them behind Access takes five minutes. The identity provider is configured, the patterns are established, and the mistakes have already been made.

Second, the process taught me where Access fits and where it does not in a homelab context. That understanding is more valuable than the specific configuration. Without trying it, I would have kept thinking of Access as something I should add to everything, and the mental overhead of that unfinished task would have persisted.

Third, for Open WebUI specifically, Access adds genuine value. Open WebUI connects to a local LLM and supports web search, which means conversations can contain sensitive queries. Having Google authentication in front of it means that even if someone discovers the URL, they cannot interact with my LLM instance. For a service with no built-in user management, Access is effectively its entire authentication layer.

-----

## What I Learned

**Access is a browser tool.** If a service is primarily accessed through native apps, mobile clients, or desktop sync agents, Access will create more problems than it solves. Evaluate each service by how you actually use it, not by how you think you should secure it.

**Google OAuth scopes are not optional.** The openid, email, and profile scopes must be explicitly added in Google Cloud Console. Without them, authentication fails in a way that does not clearly indicate missing scopes as the cause.

**The Email claim field is not for email addresses.** It is for the JWT claim name. Leave it empty for Google. This is a small UI confusion that can waste a lot of time.

**A hybrid approach is the realistic answer.** Access for browser-only services, service-level authentication for app-based services, and VPN for administrative tools. No single security layer covers everything in a homelab.

**Do not wait for perfection.** I initially hesitated to set up Access because I wanted to apply it to everything or not at all. The reality is that protecting even one service is better than protecting none while waiting for a perfect solution that does not exist.

-----

## What’s Next

The current security posture has three layers: Cloudflare Tunnel hides the server from the internet, Cloudflare Access protects browser-only services, and VPN restricts administrative tools to local access. Each service sits behind whichever combination makes sense for how it is actually used.

The area I have not touched yet is SSH hardening on the Proxmox host itself. The server currently uses default SSH settings, which means password authentication is still enabled. Moving to key-based authentication and disabling password login is a straightforward improvement that I should have done earlier.

There is also the question of whether to revisit the services currently behind Tunnel without Access. Home Assistant, Nextcloud, and Vaultwarden all have their own authentication, and all three enforce HTTPS through the tunnel. The risk is not zero, but it is manageable for a personal homelab. If any of these services were multi-tenant or served untrusted users, the calculation would be different.

Each layer added to this homelab has followed the same pattern: plan for the ideal, implement what is practical, and document the gap honestly. The ideal was Access on everything. The practical result was Access on one service and a clearer understanding of where each security tool belongs. That understanding is worth more than the configuration itself.