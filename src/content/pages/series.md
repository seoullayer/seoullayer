---
title: "Korean Apartment Homelab: Series Index"
description: "A complete guide to building and running a self-hosted homelab in a Korean apartment."
---

This series documents how I built a self-hosted homelab from scratch inside a Korean apartment. It started with a bathroom wiring problem and grew into a full Proxmox server running over fifteen services.

Each post builds on the previous one, but they also work as standalone reads if a specific topic is what you are looking for.

---

## The Series

### 1. [Building a Quiet Homelab in a Korean Apartment](/posts/building-a-quiet-homelab-in-a-korean-apartment)

The hardware build. Why I chose the i7-14700, how Korean DDR5 prices pushed me toward DDR4, and why the storage closet near the front door turned out to be the perfect spot for a server.

### 2. [My 2026 Self-Hosted Stack](/posts/my-2026-self-hosted-stack)

A walkthrough of every service running on Proxmox: what runs as a VM, what runs as an LXC container, and why. Covers Home Assistant, Nextcloud, Immich, Vaultwarden, TrueNAS, Jellyfin, and the rest of the stack.

### 3. [My Home Assistant Journey in a Korean Apartment](/posts/my-home-assistant-journey-in-a-korean-apartment)

The deep dive into smart home automation. From SmartThings fragmentation to a unified Home Assistant setup, Zigbee mesh optimization through Korean concrete walls, motorized curtains synced to sunrise, and the wall pad integration that hasn't worked yet.

### 4. [Nginx Proxy Manager on Proxmox](/posts/nginx-proxy-manager-on-proxmox-in-korea)

How I set up external access to my homelab. Choosing Dynu over DuckDNS, configuring wildcard DNS and SSL, and deciding which services to expose versus keeping behind VPN.

### 5. [Monitoring with Prometheus, Loki, and Grafana](/posts/monitoring-homelab-prometheus-grafana-proxmox)

Building a monitoring stack after two incidents that went unnoticed for days. Prometheus for metrics, Loki for logs, Grafana for dashboards, and Telegram alerts that catch problems before I notice.

### 6. [The Real Cost of Self-Hosting in Korea](/posts/real-cost-of-self-hosting-in-korea)

An honest accounting of hardware costs, electricity under Korea's progressive pricing system, and whether replacing commercial services actually saves money.

### 7. [From Port Forwarding to Cloudflare Tunnel](/posts/cloudflare-tunnel-migration-from-port-forwarding)

Migrating from port forwarding to Cloudflare Tunnel. How the 100MB per-request limit shaped which services went through the tunnel, and why a hybrid setup ended up more secure than either approach alone.

### 8. [Proxmox Tips I Learned Running a Homelab](/posts/proxmox-tips-homelab)

LXC vs VM decisions, memory ballooning, swap mysteries, and the small operational lessons that documentation does not teach you.

### 9. [Running Windows 11 on Proxmox: A Mac User's Escape Hatch in Korea](/posts/windows-11-proxmox-korea-mac)

Why a Mac user in Korea still needs Windows, how dual ISO mounting made installation painless, and the operational pattern for on-demand VMs.

### 10. [Backup Strategy for a Proxmox Homelab](/posts/backup-strategy-proxmox-homelab)

How I decide what to back up and what to skip, the swap problem that comes from backing up ten containers at once, and why mirrors are not backups.

### 11. [Adding Cloudflare Access to a Homelab](/posts/cloudflare-access-homelab)

Setting up Cloudflare Access with Google authentication, the app compatibility problem that limited where it could be applied, and why only one service ended up behind it.

### 12. [SSH Hardening on Proxmox: More Secure and More Convenient](/posts/ssh-hardening-proxmox-homelab)

Switching from password to key-based SSH authentication, saving the passphrase to macOS Keychain for passwordless login, and the iPhone app compatibility issue that required a separate key.

### 13. [Buying Smart Home Hardware on AliExpress: What Actually Works with Home Assistant](/posts/aliexpress-homelab-home-assistant-buying-guide)

A practical buying guide for Home Assistant users. What to look for in Zigbee switches and curtain motors, how to find trustworthy sellers, why Zigbee beats Wi-Fi at scale, and the compatibility checks worth doing before you order.

### 14. [Starting a Homelab with an N100 Mini PC: What I Ran, What I Learned, and When to Move On](/posts/n100-mini-pc-homelab-starting-guide)

Why an N100-class mini PC is the right starting point for a homelab, what a full year of running one actually looks like, and the signals that told me it was time to upgrade.

### 15. [Building the Network Layer: UniFi, a Korean ISP, and the IPTV VLAN Problem](/posts/unifi-network-korean-apartment-homelab)

The network underneath the homelab. Why I put the ISP modem in bridge mode for a direct public IP, the IPTV VLAN problem that breaks the moment you replace a Korean ISP router, AP placement against concrete walls, and an honest accounting of why the network is still mostly flat.

### 16. [Migrating from Xpenology to TrueNAS: The MAC Address Conflict I Didn't See Coming](/posts/truenas-xpenology-migration-mac-conflict)

Leaving Xpenology for the stability of TrueNAS. The duplicate MAC address conflict that broke my network when two servers ran at once, why the reboot that fixed it was luck rather than a solution, and how I actually set up the ZFS mirror, datasets, and SMB/NFS shares.

### 17. [Squoosh as a Native Mac App: The One Service I Chose Not to Self-Host](/posts/squoosh-native-mac-app-electron)

The one post in this series about taking something off the server. Why I moved Squoosh from a Docker container to a standalone Mac app with Electron, the COOP/COEP header injection that made the wrapper work, and why self-hosting was the wrong answer for this particular tool.

### 18. [Running a Local LLM: Why I Self-Host AI for the Things I Can't Send to the Cloud](/posts/local-llm-open-webui-privacy-homelab)

Running Gemma 4 E4B locally with LM Studio and Open WebUI on a 16GB MacBook. Why the reason is privacy rather than performance, how a local model fits into my Obsidian note workflow, the questions I only ask when nothing leaves the machine, and the honest tradeoffs of loading and unloading a model on limited memory.

### 19. [Boot and Shutdown Order: Two Different Reasons Nextcloud Kept Breaking on Reboot](/posts/proxmox-startup-order-nextcloud-nfs-dependency)

Nextcloud dropped into maintenance mode after every reboot, and it turned out to be two separate problems: an unclean shutdown leaving the maintenance flag set, and a boot-time race where Nextcloud started before TrueNAS served its NFS. How the recovery method tells them apart, and the counterintuitive way Proxmox startup delay actually works.

---

## What's Coming Next

This page will be updated as new posts are published.
