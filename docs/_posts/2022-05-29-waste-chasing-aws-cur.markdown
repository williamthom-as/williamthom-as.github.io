---
title:  "Waste chasing and the power of the AWS Cost and Usage Report"
author: william
date:   2022-05-29 10:00:00 +1000
categories: [finops, waste chasing]
tags: [finops]
published: false
---

'*Waste chaser*' is the quasi derogatory term given to people who oversimplify the FinOps framework into just finding unused resources and cheap wins.  However, what these critics fail to appreciate is that it is easily the most *satisying* of all optimisations. 

If you want to become the premier waste chaser for your organisation, arm yourself with a copy of your AWS Cost and Usage Report (or inferior cloud equivalent), and lets get started with a few simple examples.

> **Please note**: this is not an exhaustive list of things you can do to find *all* waste. This is just to give you a few examples to show you the different kinds of ways your report can be manipulated to find waste.
>
> To help me analyse these reports, I use Pal (a tool I created specifically to filter/group/project across (huge) billing files). You can absolutely use Excel or similar, but you might find some troubles when the file passes millions of rows. If you are interested in following along, the tool can be found [here](https://github.com/williamthom-as/pal). 

