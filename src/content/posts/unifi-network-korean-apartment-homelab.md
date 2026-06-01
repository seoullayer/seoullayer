---
title: "Building the Network Layer: UniFi, a Korean ISP, and the IPTV VLAN Problem"
description: "How I built the network underneath my homelab with UniFi, why I put the ISP modem in bridge mode, and the IPTV VLAN problem that breaks the moment you replace a Korean ISP router."
pubDatetime: 2026-06-01T13:28:00Z
tags: ["homelab", "korea", "self-hosting", "networking", "unifi", "vlan"]
featured: false
draft: false
---

*This post is part of the [Korean Apartment Homelab](/series) series.*

## Introduction

Across this series, the network has always been the layer underneath everything else. The Cloudflare Tunnel post talked about hiding my home IP. The Nginx Proxy Manager post talked about port forwarding through the gateway. The cost post mentioned UniFi equipment in passing. But I never wrote about the network itself: what the hardware is, how it connects to a Korean ISP, and the decisions that shaped it.

This post fills that gap. It is the layer that all the security and self-hosting work sits on top of, and it has a few characteristics that are specific to running a homelab in a Korean apartment.

The physical starting point is the same storage closet near the front door that I have mentioned before. In a Korean apartment, this small space near the entrance is usually where the building's electrical and communication wiring enters the home. That makes it the natural home for networking equipment, even before you think of it as a homelab. The fiber comes in there, the ISP equipment lives there, and everything else grows around it.

---

## The ISP Side: Bridge Mode and a Real Public IP

In Korea, residential internet usually arrives as a bundle. Internet and IPTV are sold together and delivered over a single fiber line into the apartment. The ISP provides a combined router that handles everything: routing, Wi-Fi, and the internal separation between your internet traffic and the IPTV service.

If you want to run your own gateway, the first decision is what to do with that ISP router.

There are two options. You can leave the ISP router in place and connect your own gateway behind it, which creates a double NAT situation: two routers, two layers of network address translation, your gateway sitting on a private IP handed out by the ISP router. Or you can put the ISP equipment into bridge mode, which turns it into a simple pass-through. In bridge mode, the ISP device stops routing and stops handing out private addresses. Instead, it passes the connection straight through to whatever is behind it.

I chose bridge mode. My UniFi Cloud Gateway Fiber sits directly behind the bridged ISP equipment and receives a real public IP address on its WAN interface.

This decision matters more than it might seem. Double NAT is the source of a long list of homelab headaches. Port forwarding becomes a two-step process where you forward on both routers. VPN endpoints behind double NAT often need extra configuration or simply do not work cleanly. Any service that tries to discover its own external reachability gets confused. By putting the ISP device in bridge mode, my gateway becomes the single point where the public internet meets my network, and everything I configure happens in one place.

This is also where the public IP question from the Cloudflare Tunnel post originates. Because my gateway gets a real public IP directly, port forwarding worked for months without trouble. But that public IP is not guaranteed. Korean ISPs can and do place customers behind Carrier-Grade NAT, where your gateway's WAN interface receives a non-public address from a shared range and the actual translation to a public IP happens upstream in the ISP's network. The result is that there is no public IP that points at your gateway and no way to accept inbound connections. Bridge mode does not protect you from that; it just means that as long as the ISP gives you a routable address, your gateway gets it directly. The move to Cloudflare Tunnel was partly insurance against the day that stops being true, since an outbound tunnel does not care whether your IP is public or not.

One practical note: how you enable bridge mode varies by ISP, and in some cases it is not exposed in the customer-facing settings at all. Depending on the provider, you may need to call support and ask them to switch the device to bridge mode on their end. This is worth doing before you build anything else, because it determines the shape of your entire network.

---

## The IPTV VLAN Problem

This is the part that is genuinely specific to Korea, and it is the part most likely to catch you off guard.

When the ISP delivers internet and IPTV over one line, those two services are not just sharing a cable. They are separated by VLAN tags. The ISP router knows that internet traffic belongs on one VLAN and IPTV traffic belongs on another, and it handles that separation internally so you never have to think about it. The set-top box plugs into the ISP router, gets an address from the ISP's IPTV network, and the TV works.

The moment you replace that ISP router with your own gateway, that internal separation disappears. Your UniFi gateway does not know that the IPTV service exists, let alone which VLAN it is supposed to use. The internet keeps working because that traffic arrives in the form the gateway already handles by default, while IPTV is the part that requires a specific VLAN tag the gateway is not applying. So the set-top box goes dark. It cannot reach the IPTV network, which means it cannot get an address or pull the streams, and the TV shows nothing.

This is why so many people in Korea who buy their own networking gear end up keeping the ISP router in the chain just for IPTV. It feels like the only way to make the TV work. But it is not, and understanding why turns this into a solvable problem rather than a dead end.

The fix is to replicate the VLAN tagging that the ISP router was doing for you. The IPTV service lives on a specific VLAN, and you need to tag the port that the set-top box connects to with that VLAN ID. On UniFi, this means creating a network for the IPTV VLAN, then assigning the switch port where the set-top box plugs in to use that VLAN. Once the set-top box is on the correctly tagged VLAN, it can reach the ISP's IPTV infrastructure exactly as it did before, get its address, and stream normally.

There are two complications worth knowing about in advance.

The first is finding the correct VLAN ID. This is not standardized. It varies by ISP, and in some cases by region or even by apartment complex, depending on how the building's network was provisioned. There is no single number I can give you that will work everywhere, and I would be suspicious of any guide that claims otherwise. Finding yours usually means checking the ISP router's configuration before you decommission it, looking at what other people with the same provider have documented, or in the worst case, capturing the tagged traffic to see which VLAN the set-top box is using. This is the most tedious part of the whole process.

The second is multicast. IPTV streams are delivered as multicast traffic, which behaves differently from the normal unicast traffic that makes up most of your internet use. Without the right multicast handling, you can end up with IPTV traffic flooding your network or simply not reaching the set-top box. On UniFi, the relevant setting is IGMP snooping, which I enabled on the IPTV network specifically. IGMP snooping lets the switch track which port has actually requested a multicast stream and forward it only there, instead of blasting it to every port on the VLAN. Tagging the port alone was not enough; the streams flowed cleanly only after IGMP snooping was set correctly for that network. This is easy to overlook because the symptom (TV does not work, or the network behaves strangely) can look like a VLAN tagging problem even when the cause is multicast handling.

In my setup, the IPTV set-top box sits on its own dedicated VLAN with the correct tag and multicast handling, plugged into a tagged switch port. Everything else, including the smart TV itself, stays on the default network. The smart TV connects over Wi-Fi to the default VLAN, because what it needs is normal internet access for streaming apps, not the ISP's IPTV multicast service. The set-top box and the smart TV look like they should be related, but from a network perspective they have completely different requirements, and separating them is what makes both work.

---

## The Hardware Stack

The network runs entirely on UniFi equipment. The core is a UniFi Cloud Gateway Fiber, connected to UniFi switches and access points throughout the apartment.

The reason I went with a single ecosystem rather than mixing components from different vendors is management. UniFi presents the entire network through one interface. The gateway, the switches, the access points, the VLANs, the firewall rules, and the client list all live in the same controller. For a one-person homelab where the network is infrastructure I want to maintain rather than a hobby in itself, that consolidation is worth a lot. When I need to tag a port for the IPTV VLAN or check which device is consuming bandwidth, I do it in one place.

That convenience is the main argument for UniFi, but it is fair to name the trade-offs too. UniFi is more expensive than assembling an equivalent network from generic managed switches and a router running open-source firmware. You are also buying into an ecosystem, which means you are dependent on the vendor's software direction, their controller updates, and their hardware availability. For someone who enjoys building routers from scratch or running OPNsense on a mini PC, UniFi might feel like paying for polish you do not need. For me, the polish is the point. I already spend enough time inside Proxmox, Home Assistant, and the rest of the stack. The network is the layer I want to be boring and reliable, and UniFi delivers that.

The gateway choice specifically came down to the fiber line. The Cloud Gateway Fiber is designed to terminate a fiber connection directly, which fits the way internet arrives in a Korean apartment. It also has a built-in VPN endpoint, which has been one of the more useful features in practice. As I covered in the Nginx Proxy Manager post, the UniFi VPN is what I use for administrative services that should never be publicly exposed, like the Proxmox interface and the monitoring dashboards. The app makes connecting straightforward, and the stability has been excellent.

---

## Access Points and Concrete Walls

Anyone who has read the Home Assistant post in this series knows that concrete walls are a recurring antagonist. Korean apartments are built with concrete, and concrete attenuates wireless signals badly. That post covered the problem in the context of Zigbee, where the fix was adding repeater nodes to the mesh. The same physics apply to Wi-Fi, and the solution follows the same logic.

A single access point, no matter how capable, struggles to cover a concrete apartment evenly. The signal that looks strong in the room with the AP degrades sharply once it has to pass through one or two interior walls. The result is the familiar pattern of one room with excellent coverage and a far corner where devices constantly drop or fall back to frustratingly slow speeds.

The answer is the same as it was for Zigbee: do not rely on a single radio to cover the whole space. Multiple access points, placed so that coverage overlaps rather than stretches, produce a far more consistent result than one powerful AP trying to punch through walls. UniFi makes running multiple APs straightforward because they are all managed from the same controller and hand off clients between them automatically.

The practical advice, which mirrors what I said about Zigbee repeater placement, is to plan AP placement around the walls rather than around the floor plan. The room layout tells you where people are. The wall layout tells you where the signal will die. Those are not the same map, and the second one is the one that matters for coverage.

---

## Segmentation: An Honest Accounting

Here is the part where I have to be honest about what I have not done.

A well-segmented home network separates devices by trust level. Your homelab servers on one VLAN, your IoT devices on another, your personal computers and phones on a third, guests on a fourth. Firewall rules between them limit what can talk to what, so that a compromised smart plug cannot reach your Proxmox host, and a guest on your Wi-Fi cannot see your file server. This is the textbook approach, and it is genuinely good practice.

My network is not like that.

The only VLAN I run is the IPTV one, and that exists out of necessity rather than as a security decision. The set-top box needs its own tagged VLAN to function at all. Everything else, including my homelab servers, my IoT devices, and my personal machines, sits on the default network. It is, for practical purposes, a flat network with one carved-out exception for the television.

I want to explain why, because "I have not gotten to it yet" is only part of the answer.

Segmenting a network properly is not just creating VLANs. It is designing the firewall rules between them, and then living with the consequences. The moment you put your IoT devices on a separate VLAN from Home Assistant, you have to explicitly allow Home Assistant to reach those devices, and many integrations rely on discovery protocols that do not cross VLAN boundaries without extra configuration. mDNS, which a lot of smart home and casting devices depend on, needs a reflector to work across VLANs. Every separation you add creates a set of exceptions you have to maintain. For a multi-person network or one serving untrusted users, that complexity is clearly worth it. For a single-person homelab in an apartment, where I am the only user and I control every device on the network, the security benefit is real but smaller, and the maintenance cost is immediate.

That is the actual trade-off, and right now it has not tipped in favor of full segmentation. The honest version of the rule I follow is the same one that shows up throughout this series: plan for the ideal, implement what is practical, and document the gap. The ideal is a properly segmented network. The practical reality is a flat network with an IPTV VLAN. The gap is something I am aware of rather than something I have closed.

If I were exposing services to untrusted users, or if my IoT devices were ones I did not trust, the calculation would be different and I would have segmented already. It is worth being clear that I did not choose Zigbee for security reasons. I chose it because it is low power, has good range, and forms a stable mesh, whereas piling dozens of Wi-Fi devices onto the same congested 2.4GHz band in an apartment building is the opposite of stable. That choice happens to keep most of my IoT hardware off the IP network entirely, communicating locally through a coordinator instead, which incidentally shrinks the IP-level surface that segmentation would otherwise address. That is a side effect, not a substitute for proper segmentation, and it does nothing for the IP devices that remain, including the Home Assistant server itself. But it is part of why a flat network has not bitten me yet.

---

## Lessons Learned

**Bridge mode first.** Before building anything, decide what to do with the ISP router. Bridge mode gives your own gateway a direct public IP and avoids the long list of double NAT problems. Depending on the ISP, enabling it may require a call to support, so handle this early.

**IPTV will break, and that is fixable.** Replacing a Korean ISP router with your own gateway breaks IPTV because the VLAN separation the ISP router handled silently is now your responsibility. Tag the set-top box's port with the correct IPTV VLAN and configure multicast handling. The hard part is finding the VLAN ID, which is not standardized.

**The set-top box and the smart TV are different problems.** The set-top box needs the IPTV VLAN and multicast. The smart TV just needs normal internet for its apps. Putting them on the same network because they are both "the TV" is a mistake. Mine are deliberately separated: set-top box on the IPTV VLAN, smart TV on the default network over Wi-Fi.

**Plan access point placement around walls, not rooms.** Concrete attenuation is the same problem for Wi-Fi as it is for Zigbee. Multiple overlapping access points beat one powerful AP fighting through walls.

**A flat network is a defensible choice, but know that it is a choice.** Full VLAN segmentation is good practice, but the maintenance cost is real, especially for smart home integrations that rely on cross-VLAN discovery. For a single-person homelab, deferring it can be reasonable, as long as you are honest that you are deferring it rather than pretending it is done.

---

## What's Next

The obvious next step for the network is the segmentation I just admitted I have not done. Separating IoT devices and homelab servers onto their own VLANs, with firewall rules between them, would meaningfully reduce the blast radius if any single device were compromised. The reason I keep circling it without doing it is the cross-VLAN discovery problem for Home Assistant, which is solvable but tedious. When I work through it, it will probably become its own post, because the gap between "create a VLAN" and "keep every smart home integration working across VLANs" is exactly the kind of practical detail this series exists to document.

The network has followed the same arc as everything else in this homelab. It started as whatever the ISP handed me, became a deliberate choice when I put the modem in bridge mode and took over routing, and grew a single VLAN the day I decided the TV was worth the trouble. Each change solved a specific problem I was actually having. The next one will too, whenever the flat network finally gives me a reason to care.

The homelab keeps growing, one layer at a time.
