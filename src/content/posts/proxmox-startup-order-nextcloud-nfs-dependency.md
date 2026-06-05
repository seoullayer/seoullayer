---
## title: “Boot and Shutdown Order: Two Different Reasons Nextcloud Kept Breaking on Reboot”
description: “Nextcloud showed maintenance mode after every reboot, but it turned out to be two separate problems with two separate fixes: shutdown order and a boot-time mount race. How to tell them apart and how Proxmox startup delay actually works.”
pubDatetime: 2026-06-05T00:16:00Z
tags: [“homelab”, “proxmox”, “self-hosting”, “nextcloud”, “truenas”, “nfs”]
featured: false
draft: false
---

*This post is part of the [Korean Apartment Homelab](/series) series.*

## Introduction

After the TrueNAS migration I wrote about recently, most of my services keep their data on the NAS, mounted in over NFS. The VMs and containers run on fast local storage, but the data they care about lives on the TrueNAS mirror. For normal running it works exactly as intended.

Rebooting the whole server was a different story. Every time the host came back up, Nextcloud was showing maintenance mode and refusing to work. Jellyfin and Immich, which depend on the same TrueNAS over the same NFS, came back fine. Only Nextcloud broke.

What I eventually figured out is that this was not one problem. It was two, with two different causes and two different fixes, and they happened to produce a similar-looking symptom. The thing that let me tell them apart was not a log file. It was that the two states needed completely different actions to recover from. That detail is what this post is really about, because if you are hitting the same maintenance loop, knowing which of the two you have is the whole game.

-----

## A Quick Note on Maintenance Mode

Maintenance mode is a state where Nextcloud stops serving normally and shows a message saying the system is under maintenance. It exists so that Nextcloud does not try to operate when it should not, for example during an upgrade or when something is wrong with its environment.

You can turn it off deliberately. In my Docker Compose setup, the command is:

```
docker compose exec -u www-data app php occ maintenance:mode --off
```

Hold onto that command, because whether or not it actually fixes the problem is exactly what distinguishes the two failures below.

-----

## Problem One: Shutdown Order

With no startup or shutdown order configured, Proxmox shuts guests down without regard to their dependencies. In my case TrueNAS would often shut down before Nextcloud had finished. The moment TrueNAS went down, the NFS share backing Nextcloud’s data disappeared out from under a service that was still running.

I could see this happening indirectly: Nextcloud took an unusually long time to shut down, far longer than the other services, because it was struggling against storage that had vanished mid-shutdown. The unclean stop left Nextcloud’s maintenance flag set, and on the next boot it came up in maintenance mode.

The tell for this version of the problem is the recovery. Running the `occ maintenance:mode --off` command cleared it. That is the signature of a genuine maintenance flag: Nextcloud really had set the flag, so explicitly turning it off resolved the state. If the off command works, you are dealing with a flag that got left on, which points back at an unclean shutdown.

The fix is shutdown order. Proxmox lets you assign each guest a start/shutdown order number. Guests start in ascending order, and critically, shut down in the reverse. I gave TrueNAS order 1 and Nextcloud order 2. Because shutdown runs highest-first, Nextcloud (2) now stops before TrueNAS (1). Nextcloud gets to shut down cleanly while its storage is still mounted, instead of having the NFS pulled away mid-stop. With that in place, the long shutdowns stopped, and so did the maintenance flag that the unclean stops had been leaving behind.

-----

## Problem Two: The Boot-Time Mount Race

Fixing the shutdown order did not make the reboots fully clean. Nextcloud would still come up showing maintenance mode, but this time it behaved differently, and the difference is what revealed it was a separate problem.

This time, the `occ maintenance:mode --off` command did not fix it. The state looked like maintenance mode in the client, but turning the flag off did nothing to recover it. The only thing that worked was restarting the Nextcloud service itself.

That difference in recovery is the clue. If clearing the maintenance flag does not help and only a restart does, then the flag is not really the problem. What was actually happening is a race at boot. When the host starts, it brings TrueNAS up, but TrueNAS takes time to finish booting and begin serving NFS. Nextcloud was starting before that storage was ready, finding its data directory absent, and coming up in a broken state. Clearing a flag cannot fix that, because the issue is not a flag; it is that Nextcloud initialized without its storage and needs to start over now that the mount exists. Hence the restart.

The fix is to make sure the storage is ready before Nextcloud starts, and this is where Proxmox startup delay comes in. But there is a trap here that cost me time, because the delay does not work the way intuition suggests.

My first instinct was to put the delay on Nextcloud. Nextcloud is the thing that needs to wait, so tell Nextcloud to wait. I gave it a 60-second delay and it changed nothing. The reason is that in Proxmox, the startup delay attached to a guest does not mean “wait this long before starting me.” It means “after starting me, wait this long before starting the next guest in the order.” The delay applies forward, to whatever comes after, not to the guest it is set on. A delay on Nextcloud was pushing back whatever started after Nextcloud, which was not the problem.

The delay belongs on the dependency. I moved the 60-second delay to TrueNAS, the guest with order 1. Now the boot sequence is: start TrueNAS, wait 60 seconds, then start Nextcloud. That pause is the window TrueNAS needs to finish booting and serve its NFS. By the time Nextcloud starts, the mount is there, and it comes up cleanly. After moving the delay to the right guest, the reboots were finally clean in both directions.

-----

## Why Only Nextcloud

Jellyfin and Immich depend on the same NFS, so why did neither of them ever break this way?

Because they tolerate a missing mount and Nextcloud does not. If the share is not there when Jellyfin starts, it shows an empty or partial library and quietly recovers once the mount appears. There is no latched state, no flag, nothing to clear. Nextcloud takes the opposite stance: it is a full application responsible for the integrity of your files, and running without its data directory is exactly when it could do harm. So it refuses, loudly, rather than limping along.

That is worth saying plainly because it reframes the whole situation. Nextcloud is not the fragile one here. It is the strict one, and the strictness is a feature when the thing it is protecting is your data. The other services are more forgiving precisely because the cost of them getting it wrong is lower. Knowing which of your services are strict and which are tolerant tells you exactly which ones need careful boot and shutdown choreography. You do not have to orchestrate everything, only the strict ones.

-----

## Lessons Learned

**The same symptom can be two different problems. Recovery method tells them apart.** Both failures showed maintenance mode, but one was cleared by `occ maintenance:mode --off` and the other only by restarting the service. If the off command works, it is a real maintenance flag left by an unclean shutdown. If only a restart works, the service started without its storage and the flag is a red herring.

**Shutdown order protects strict services on the way down.** Proxmox shuts guests down in reverse start order. Giving the storage a lower order number than the services that depend on it means those services stop first, while their storage is still mounted, avoiding the unclean stop that leaves a maintenance flag set.

**Startup delay applies forward, to the next guest.** The delay on a guest means “after starting this one, wait before starting the next.” It does not make the guest it is set on wait. Put the delay on the dependency (the NAS), not on the dependent service, so the pause lands before the dependent service starts.

**“Started” is not “ready.”** Ordering guarantees the NAS starts first, but starting is not the same as serving NFS. The delay is what bridges the gap between powered on and actually ready.

**Know which services are strict.** Nextcloud latches; Jellyfin and Immich recover on their own. Spend the boot-order effort on the strict services, and recognize that their strictness is protecting your data, not malfunctioning.

-----

## What’s Next

These were small fixes, an order number and a delay in the right place, but together they closed the last rough edges from the TrueNAS migration. Planned reboots are now clean in both directions with no manual cleanup, which is most of what reliability means day to day.

The case I have not properly handled yet is the disorderly one: a power cut or a host that goes down hard, where ordered shutdown never gets a chance to run. That is where a UPS and a tested recovery procedure earn their place, and it is a topic for a future post once I have actually done the work rather than just intending to.

The homelab keeps growing, one layer at a time.