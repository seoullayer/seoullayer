---
title: "Starting a Homelab with an N100 Mini PC: What I Ran, What I Learned, and When to Move On"
description: "Why an N100-class mini PC is the right starting point for a homelab, what I actually ran on mine, and the signals that told me it was time to upgrade."
pubDatetime: 2026-05-30T14:21:00Z
tags: ["homelab", "proxmox", "self-hosting", "n100", "mini-pc", "home-assistant"]
featured: false
draft: false
---

## Introduction

Most homelabs do not start with a homelab. They start with a single problem that needs a single service. Home Assistant for smart home automation, Plex for media, Pi-hole for network-wide ad blocking. Whatever it is, you only need one thing at first, and the question is what to run it on.

The advice you find online ranges wildly. Some people recommend repurposing an old desktop. Some push enterprise hardware off eBay. Some swear by Raspberry Pi clusters. All of these can work, but none of them are what I would recommend to someone starting today.

I started with an Intel N100 mini PC from AliExpress for around $123. It ran Home Assistant, Zigbee2MQTT, Nginx Proxy Manager, AdGuard Home, Xpenology, and Plex for almost a year before I felt any need to move on. By the end, I was confident enough in the platform that I built a much larger server. But the N100 — or really, any mini PC in that class — is what I would still tell someone to buy if they were starting now.

This post is about why that recommendation makes sense, what I actually ran on mine, and the signals that told me it was time to upgrade.

---

## Why a Mini PC in This Class

When you are starting a homelab, the worst thing you can do is buy hardware that matches what you imagine your homelab will eventually become. You do not know yet. You think you want Plex and Home Assistant, but you have not run them. You have not felt the limits. You have not discovered the services you will actually care about, because you have not built the habits that lead you to them.

A mini PC in the N100 class — and there are several similar options now, from various manufacturers using Intel N100, N95, or comparable low-power chips — solves this problem by being cheap enough that the wrong decision does not hurt. If you outgrow it in six months, you have spent about the same as a year of cloud subscriptions. If you do not get into homelabbing at all, you have a small, silent computer you can repurpose as a media player, a backup machine, or a gift.

The specifications also turn out to be more capable than people expect. The N100 has four cores, supports up to 16GB of RAM in most configurations, and idles at around 10 watts. That is enough to run a dozen lightweight services simultaneously without breaking a sweat. It is not a server in the traditional sense, but for the workloads a beginner homelab actually generates, it is more than sufficient.

My specific unit came with 12GB of RAM and a 512GB SSD. The community consensus at the time was that 8GB was enough, and I half-wondered if I had overspent. In hindsight, the extra memory turned out to be the right call. Once I started running multiple services on Proxmox, memory was the first thing I noticed creeping upward. Eight gigabytes would have worked, but twelve gave me room to keep adding without thinking about it.

There is nothing magic about the N100 specifically. The point is the category: a fanless or near-fanless x86 mini PC, around $120 to $200, with enough RAM and storage to run a virtualization layer plus several services. There are good options from manufacturers like Beelink, GMKtec, and many others on AliExpress and Amazon. What matters is the class of machine, not the specific model.

---

## Proxmox From Day One

When I first looked into how to install Home Assistant, the most common community recommendation was Home Assistant OS — a turnkey image that runs Home Assistant directly on the hardware without any underlying operating system you need to manage. It is the simplest possible path.

I did not go with Home Assistant OS. The same communities that recommended HA OS also frequently recommended Proxmox as the better long-term choice, and after reading both sides, the Proxmox argument was more convincing for the hardware I had.

The reasoning comes down to what kind of machine the N100 actually is. On a Raspberry Pi or a similarly constrained device, running a single-purpose OS makes sense because the hardware has just enough headroom for one job. On an N100, you have far more resources than Home Assistant alone will ever need. Installing HA OS on an N100 is leaving most of the machine unused.

Proxmox lets you split that hardware into multiple isolated environments. You can run Home Assistant in a VM, and then run other services in separate containers or VMs without them interfering with each other. From the perspective of the services running on it, the single mini PC behaves like several smaller computers. That separation turned out to matter in ways I did not anticipate when I started.

For anyone starting with an N100-class mini PC, my recommendation is to install Proxmox first and then run Home Assistant as a VM on top of it. The extra setup takes maybe an hour. The flexibility you gain is what makes the entire homelab journey possible.

---

## How the Stack Grew

The progression from one service to many followed a pattern I only recognized in retrospect.

I started with two things: Home Assistant in a VM, and Nginx Proxy Manager in a container for external access. That was enough for what I originally wanted — a way to control smart home devices remotely. It would have been a complete homelab for many people, and it would have justified the N100 by itself.

The turning point came from a mistake. I had been running Zigbee2MQTT as a Home Assistant add-on, which is the default suggestion for most beginners. Then I changed a configuration incorrectly, and the Zigbee setup collapsed in a way that I could not easily recover from. I had to rebuild it, this time in a separate LXC container rather than inside Home Assistant. The technical details of that experience are in another post — what matters here is the conclusion I drew from it.

Running Zigbee2MQTT as its own container meant that a failure inside it could not take down Home Assistant. And running Home Assistant as a VM meant that a failure inside it could not take down anything else. The isolation was not theoretical. It was the reason a recovery from a configuration mistake stayed contained instead of cascading.

That experience also changed how I thought about the hardware. The N100 was no longer one computer running services. It was a small platform that could host multiple independent environments, each one playing its own role. That mental shift is what made me start looking for other services to add.

AdGuard Home went in next — a network-wide DNS and ad blocking service, lightweight enough that it ran comfortably in a container. Then I installed Xpenology, an unofficial port of Synology's DSM that turns generic hardware into a NAS-like environment. Xpenology was heavier than AdGuard, but the N100 handled it fine. With Xpenology running, I had a NAS, and with the NAS in place, installing Plex on top of it was an easy next step.

By this point, the mini PC was running six services across VMs and containers, and the experience was genuinely fun. Not because the services themselves were exciting — they are not — but because the act of partitioning one small machine into multiple working systems felt like operating real infrastructure at a personal scale. That feeling is what kept me adding more, and that feeling is what I think most homelab enthusiasts are actually chasing. Proxmox on a cheap mini PC is what makes it accessible.

This is also the strongest argument for choosing Proxmox over a single-purpose OS at the start. If I had installed Home Assistant OS, none of what came after would have been possible without wiping the machine and starting over. The choice of platform on day one quietly determined how far the homelab could grow.

---

## The Storage Problem

There is one limitation of the N100 mini PC that becomes obvious within weeks: storage.

The unit I bought had a 512GB SSD, which is generous for a mini PC but small for a NAS. Once Xpenology was running and I started using it as a file server, the space filled quickly. Photos, media files, and backups all compete for the same drive. There is no room for a second drive in a typical mini PC chassis, and even if you add an external USB drive, the configuration is awkward and the performance is not what you want for a serious NAS.

What I ended up doing was treating the NAS less as long-term storage and more as a working surface. Files went on, files came off. Anything I needed to keep got copied elsewhere. This was not how a NAS is supposed to be used, but it worked because the experience of running the software — the snapshots, the user management, the package ecosystem — was valuable even when the storage capacity was limited.

The point of mentioning this is not to warn people away from mini PCs. It is to be honest about what they are and are not good for. As a platform for learning, experimenting, and running services that do not need huge amounts of storage, an N100 mini PC is excellent. As a long-term solution for storing your entire media library or your family's photo backup, it will be the first thing you outgrow.

---

## When the N100 Showed Its Limits

For most of the time I ran the N100, the limits I bumped into were storage limits, not compute limits. The CPU was barely working. Memory was the more variable resource, but with 12GB I had enough margin.

The compute limit only appeared when I added a Minecraft server.

Minecraft is, surprisingly, one of the more demanding things you can run on a homelab. The Java edition is memory-hungry and the world generation and entity tracking put real load on the CPU. With a few players connected and a moderately active world, the N100 started to feel the strain. Other services — Home Assistant in particular — became noticeably less responsive when the Minecraft server was busy.

This was the moment I started thinking about an upgrade. Not because the N100 had broken, but because I had reached a service that did not fit comfortably alongside everything else. The N100 could run Minecraft, or it could run everything else well, but it could not do both at the same time without compromises.

The other limitation that pushed me toward an upgrade was the lack of expansion. The mini PC had one SSD slot, one RAM slot in many configurations, and no room for additional storage. There was no path to grow within the chassis. The only way forward was a new machine.

These are the right signals to look for. If you find yourself wanting to run a workload that genuinely strains the CPU, or needing storage that the chassis cannot accommodate, the mini PC has done its job. It taught you what you actually want, and the next machine you build will be designed around real requirements rather than guesses.

---

## Noise: The Thing Nobody Mentions

Mini PCs are advertised as quiet, and most of them are quiet enough for an office environment. But "quiet" and "appropriate for a bedroom" are not the same thing.

The N100 unit I bought had a small fan that produced a high-frequency tone — not loud in absolute terms, but the kind of pitch that becomes irritating once you notice it. In a living room with ambient noise, it disappeared completely. In a bedroom at night, it was distracting enough that I could not leave it there.

What I ended up doing was placing the mini PC inside the electrical utility closet near the front door. The space was out of the way, the noise was inaudible from the rest of the apartment, and the form factor of the mini PC made it physically feasible to put it in such a small space. Looking back, this was not actually a good solution. The closet had limited airflow, and I was relying on the fact that the N100 generates very little heat to compensate. It worked, but only because the hardware was so efficient.

For anyone setting up a mini PC homelab, the lesson is to think about placement before you buy. Where will the device live? Will it be in a room where you sleep or work? Is there airflow? Is there a power outlet nearby? These questions sound trivial, but they shape the daily experience of running a homelab more than most technical decisions do.

If you have a basement, garage, or dedicated office, none of this matters. In an apartment, it can be the difference between a homelab you live with comfortably and one you keep wishing you could move.

---

## What to Expect When You Start

If I had to give one piece of advice to someone considering a homelab, it would be this: do not overbuild on day one.

The mini PC class of hardware exists in a sweet spot that nothing else quite occupies. It is cheap enough that the financial risk is small. It is powerful enough that you will spend months exploring its capabilities before you hit a wall. It is small enough that placement is flexible. And it is x86, which means you can run anything — Proxmox, any Linux distribution, any service that is not specifically designed for ARM.

A Raspberry Pi is cheaper, but its capabilities are limited and many self-hosted services run poorly on ARM. A used desktop is more powerful, but it uses more power, generates more heat, and takes up more space. Enterprise hardware off eBay is impressive on paper, but power consumption alone makes it impractical in an apartment, and noise levels are often unacceptable in any living space.

The N100-class mini PC avoids all of these compromises while costing about the same as a single piece of mainstream consumer electronics. It is the right answer for most people starting out.

When you eventually outgrow it, you will know exactly why. The reasons will be specific to your usage — a service that needs more CPU, storage requirements that the chassis cannot accommodate, a desire to run something that demands hardware passthrough. Those specific reasons are what should drive your next purchase, not vague aspirations. The mini PC's job is to get you to that point without wasting your money.

Mine cost $123. By the time I retired it, I had learned enough about my own preferences to confidently build a much larger server. That alone justified the purchase, regardless of anything else the mini PC did. As an investment in figuring out what you actually want, it is hard to beat.
