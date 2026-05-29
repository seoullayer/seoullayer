---
title: "Buying Smart Home Hardware on AliExpress: What Actually Works with Home Assistant"
description: "A practical guide to buying switches, motorized curtains, and Zigbee hardware on AliExpress for Home Assistant — what to look for, how to find trustworthy sellers, and the compatibility traps worth knowing about."
pubDatetime: 2026-05-29T15:03:00Z
tags: ["homelab", "home-assistant", "zigbee", "aliexpress", "smart-home", "self-hosting"]
featured: false
draft: false
---

## Introduction

If you spend any time in Home Assistant communities, you will notice a pattern. Someone asks for a good smart switch recommendation. Half the replies point to Sonoff, Aqara, or IKEA. The other half point to AliExpress listings that look identical to the branded products but cost a third of the price.

That second group is not wrong. This is true more often than you might expect: a meaningful share of smart home hardware sold under recognizable brand names comes from the same manufacturing ecosystem in China. The difference between the branded version and the AliExpress listing is often packaging, a warranty card, and a markup.

I have been buying smart home hardware from AliExpress for over a year. Switches, motorized curtain motors, a Zigbee coordinator, a mini PC that became my first homelab server — all from AliExpress, all running through Home Assistant. The experience has been positive, but not because I got lucky. The difference between a smooth AliExpress experience and a frustrating one comes down to a few specific habits that are easy to develop once you know what to look for.

This post covers what I actually buy, how I find sellers I trust, and the compatibility considerations that matter specifically for Home Assistant setups.

---

## Why AliExpress for Smart Home Hardware

The obvious answer is price. A Zigbee smart switch that sells for $25 at a local retailer often has an equivalent on AliExpress for $6 to $10. For a single switch that difference is minor. When you are wiring an entire apartment, it becomes significant.

But price alone is not the reason I keep going back. The more important reason is selection.

The smart home hardware market in most countries is dominated by a handful of ecosystems: Google Home, Amazon Alexa, Apple HomeKit, SmartThings. Hardware designed for these platforms works well within those platforms and often nowhere else. If you want devices that integrate with Home Assistant without cloud dependency, especially Zigbee devices that communicate locally, your options at mainstream retailers are limited.

AliExpress has a much wider range of Zigbee hardware that can work with local control setups like Zigbee2MQTT. Many of these products are built on common chipsets like the Texas Instruments CC2652 or Silicon Labs EFR32, which are well-supported by Zigbee2MQTT and Home Assistant's ZHA integration. You are not buying exotic hardware. You are buying the same chipsets used in branded products, in a different enclosure, sold without a brand premium.

---

## What I Actually Buy There

### Smart Switches

Switches were my most frequent AliExpress purchase, and they have had the highest success rate. The key distinction for Home Assistant users is whether a switch is Zigbee or Wi-Fi based.

Wi-Fi smart switches typically use the Tuya platform or a manufacturer-specific cloud. They can be integrated into Home Assistant through the Tuya integration or, for some models, flashed with custom firmware like Tasmota or ESPHome. But this adds complexity. Cloud-dependent switches need an active internet connection to function, and Tuya's local API support has varied over the years.

Zigbee switches communicate locally through your Zigbee coordinator, with no cloud involvement. In my experience, this is the right default choice for anyone running Home Assistant. Response times are faster, reliability is better, and you are not dependent on any external service staying operational.

For switches specifically, I look for products listing "Zigbee" explicitly in the title and description, with a supported chipset mentioned in the specifications. Checking compatibility before buying takes two minutes and prevents surprises after delivery — more on how to do that later in this post.

### Motorized Curtain Motors

This category taught me the most about how AliExpress products actually work, and it is worth spending more time on.

Motorized curtain motors on AliExpress come from a small number of actual manufacturers, but they appear under dozens of different store names and brand labels. The motor casings look identical. The specifications are identical. The listing photos look like they came from the same photoshoot — because they probably did. Different sellers, same factory.

![Four AliExpress listings for smart curtain motors. Different brand names, different prices, nearly identical hardware.](/images/homelab/alexpress-curtainmotor.webp)

Most of the time, this does not matter. The product works and integrates with Home Assistant through Zigbee2MQTT.

But there is one variation that caught me: the direction mapping. I ordered a curtain motor from a seller I had not used before. The hardware worked perfectly. Home Assistant saw it immediately. Then I tested it and found that sending an "open" command closed the curtain, and a "close" command opened it.

The most likely explanation is that different sellers configure the direction convention differently during manufacturing, even on what appears to be the same hardware. When I was still using SmartThings, this would have been a permanent problem. The SmartThings driver for this type of motor had no option to reverse direction. There was no workaround available in the platform.

In Home Assistant, the fix was a single toggle in the device settings. Zigbee2MQTT exposes a direction reversal option for these motors, and flipping it resolved the issue immediately. What would have been a hardware return on SmartThings was a thirty-second configuration change in Home Assistant.

This is one reason why Home Assistant's flexibility matters when buying hardware from less predictable sources. The platform does not assume the device will behave exactly as documented, and that assumption turns out to be useful more often than it should.

### Zigbee Coordinator

The Zigbee coordinator is the one component where I would not try to save money at the expense of quality. It is the heart of your entire Zigbee network. If it is unreliable, every device on your network becomes unreliable.

I bought the SLZB-MR3 rather than cheaper options. Dual antennas, Matter support, and a solid reputation in the community. The price difference between a good coordinator and a budget one is small relative to the cost of the devices you will connect to it. It is not worth optimizing.

For anyone starting out, the SLZB-06 is the most commonly recommended coordinator in many Home Assistant communities. The MR3 was my choice because of the dual antenna configuration and Matter support for future compatibility, but either will work well. What I would avoid is the very cheap USB dongles with no brand recognition and minimal community discussion. The coordinator is not where you want to find out that your hardware is unreliable.

### Mini PC

My first homelab server was an Intel N100 mini PC from AliExpress for around $123. It ran Home Assistant, Zigbee2MQTT, and several other services for almost a year before I outgrew it.

For mini PCs specifically, AliExpress is a genuinely good source. The N100 and N95 platforms from Intel are well-documented, the hardware is consistent across sellers who stock the same model, and the price advantage over local retailers is significant. These are not exotic products. They are standard x86 machines that run standard operating systems.

The main consideration is whether the seller includes adequate memory and storage in the configuration you are buying. Check the listed specifications carefully. Some listings show a base price for a RAM-only configuration and charge extra for storage, which can make an initially attractive price misleading.

---

## Finding a Trustworthy Seller

This is where most AliExpress advice stops at "check the ratings" and moves on. That is necessary but not sufficient.

A seller's overall rating tells you about general customer satisfaction. It does not tell you whether the specific product you are looking at is the version that works with Home Assistant, or the one that uses a different chipset than advertised.

A few habits that have worked well for me:

**Read the reviews for the specific product, not the store.** Filter for reviews that mention Home Assistant, Zigbee2MQTT, or your specific use case. If nobody has mentioned HA compatibility in the reviews, that is not necessarily a problem, but it means you are in less well-documented territory.

**Look at how long the store has been operating and their total order volume.** A store with two years of history and tens of thousands of orders is substantially lower risk than a new store with a few hundred reviews, even if the newer store's rating looks similar.

**Ask questions before ordering.** AliExpress has a question feature on product pages. Asking the seller which chipset a Zigbee device uses, or whether the product has been tested with Zigbee2MQTT, gives you useful information and also tells you something about the seller's responsiveness and knowledge of their own products. A seller who cannot answer basic technical questions about a Zigbee device is a seller I approach more cautiously.

**Check the Zigbee2MQTT supported devices list.** This is specific to Zigbee hardware, but it is the most reliable compatibility check available. The list includes the exact model numbers and notes on known issues. If the product you are considering is listed and the notes are clean, compatibility risk is low.

**Favor sellers who specialize in smart home hardware.** A store that sells only smart home products is more likely to understand what they are selling than a general electronics store where smart switches are one of five hundred product categories.

My personal approach is to spend more time on seller research than I do on price comparison. The difference between sellers on AliExpress is often a few dollars. The difference between a good experience and a frustrating one is almost always the seller, not the price.

---

## Zigbee vs Wi-Fi: Which to Buy

If you are setting up Home Assistant for the first time and deciding which protocol to build around, the choice between Zigbee and Wi-Fi matters more than any individual product decision.

Wi-Fi devices are easier to get started with. They appear on your network like any other device, many are supported by Tuya integration, and some can be flashed with ESPHome or Tasmota for local control. If you have only a few devices, Wi-Fi is perfectly functional.

The problem appears at scale. Most smart home Wi-Fi devices operate on the 2.4GHz band. Adding twenty or thirty of them alongside phones, laptops, and streaming devices to the same band creates real interference and congestion, especially in an apartment building where your neighbors' networks are already competing for the same channels.

Zigbee operates on a separate radio band and forms a mesh network. Devices that are mains-powered act as repeaters, extending the range for battery-powered devices. The more mains-powered Zigbee devices you add, the more robust the network becomes. A typical coordinator supports well over a hundred devices — far beyond what most home setups would realistically reach.

For a Korean apartment with concrete walls — or any apartment where signal attenuation between rooms is significant — the mesh behavior of Zigbee is particularly valuable. I have a smart switch functioning as a repeater between my Zigbee coordinator and a bathroom smart switch that would otherwise have marginal signal. Adding that one repeater transformed the bathroom switch from intermittently unresponsive to completely reliable.

My recommendation is to start with Zigbee if you are planning more than a handful of devices and want a system that will scale cleanly. If you want to start with one or two devices immediately without buying a coordinator first, Wi-Fi is fine as a starting point. Just be aware that migrating a large Wi-Fi device collection to Zigbee later involves replacing hardware.

---

## Before You Buy: Checking Compatibility

The single most useful resource for anyone buying Zigbee hardware for Home Assistant is the Zigbee2MQTT supported devices list at zigbee2mqtt.io/supported-devices. It documents every device the project has tested or received community reports about, including the exact model numbers you need to match against AliExpress listings.

When I find a product I am considering, I search the list for the manufacturer name and model number from the AliExpress listing. If it appears with a clean entry and no warnings, I proceed with reasonable confidence. If it does not appear, I search Home Assistant community forums and Reddit for the product name. Someone has usually bought it before you.

A few things the compatibility list will tell you that matter for buying decisions: whether the device needs to be in pairing mode with a specific button sequence, whether there are known firmware versions that cause problems, and whether certain features listed in the product description are actually exposed through Zigbee2MQTT. "Supports temperature sensing" on the product page and "temperature sensor entity available in HA" are not always the same thing.

For non-Zigbee devices, the Home Assistant integrations page and the Tuya compatibility list serve a similar purpose, though the community discussion in forums tends to be more informative than the official lists for Wi-Fi devices.

---

## Managing Expectations

AliExpress hardware is not a perfect substitute for branded products in every situation. A few realistic expectations worth setting before you start:

**Delivery takes time.** Standard shipping from AliExpress to most countries takes two to four weeks. If you need something for a specific project deadline, factor this in. Some sellers offer faster shipping options, but the cost difference reduces the price advantage.

**Quality control varies.** My failure rate has been low, but it is not zero at the population level. Buying from sellers with high order volumes helps because they are more likely to have consistent supply chains. Most AliExpress purchases include buyer protection that covers defective items, but returning a $7 switch internationally is rarely worth the effort. When ordering something you need multiple units of, ordering one to test first is a reasonable approach for expensive items.

**Support does not exist in the traditional sense.** If something does not work, you are solving the problem yourself or asking the Home Assistant community. For most Zigbee hardware, this is fine because the community knowledge base is extensive. For more unusual products, you are more on your own.

None of these are reasons to avoid AliExpress. They are reasons to approach it as an experienced buyer rather than a passive consumer. The combination of doing your own compatibility research, choosing sellers carefully, and having Home Assistant's flexibility to work around unexpected behavior has made AliExpress one of the most practical sources of smart home hardware I have found.

The motorized curtain that opens backwards is still a hardware quirk, not a feature. But in a platform flexible enough to reverse it, the quirk stops being a problem. That gap — between what AliExpress hardware ships as and what Home Assistant can make it do — is a lot of where the real value of this combination lives.
