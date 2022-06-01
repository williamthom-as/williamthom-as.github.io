---
title:  "Common tagging strategies to achieve FinOps nirvana"
author: william
date:   2022-05-09 10:00:00 +1000
categories: [finops, tagging]
tags: [finops]
---

*This is part one of the series on cloud fin ops*

It is no secret that achieving any form of productive cloud financial analysis requires a robust tagging structure. More than just useful for cost allocation, a successful tag hierarchy can be used to operationalise cost-saving practices.

Broadly speaking, as defined by the [GSA](https://www.cio.gov/assets/resources/Cloud%20Tagging%20Strategy%20Guide_v3.1.pdf), cloud tagging falls under four categories: technical, business, automation and security.

For the purposes of achieving your FinOps capabilities, let us walk through how to structure your first cloud tag hierarchy (focusing specifically on business/technical and automation categories).

### Business

Business tags fall into the aforementioned **allocation** group of tags, alongside technical. Simply put, this means we will use these tags to ~~blame~~ attribute charges to these entities when we run reports. Jokes aside, ‘who to blame’ is the lens you should use when applying these tags. All organisations are different, but common examples you should consider are:

  - **Name**: Go ahead, give it a name. This one should come as no surprise.
  - **Owner/DeployedBy/Manager/Operator**: Self-explanatory, who deployed this? Who is my go-to for answers when I have questions about this resource? See this tag the same way you see oxygen - without it, things don’t work well.
  - **CostCentre/Team/Unit/Department**: For larger organisations, cost centres may be very clearly defined. If this is the case, use a reference identifier to do this, please do not take free text (more on that later). This tag is used to broadly tell us in what area of the organisation we can find the person/team to blame.
  - **Project/Deployment**: Measuring the cost of multiple cloud resources is easier if we have a common tag field to group by.

### Technical

Technical tags are slightly *less* interesting on the finance side (but they still fall under the **allocation** group of tags). They allow for clear identification and description of what something is, and how it works. When deciding what tags to use for this category, approach it from the lens of understanding what the resource is used for. That said, common options we should consider are:

  - **Application/ApplicationVersion/Role/Purpose**: List off how this resource plays in a bigger ecosystem of resources. Examples: application => MyApp, version => v2, purpose => DatabaseServer.
  - **Environment**: Allows for distinction between production, test, development, QA... and the list goes on.

### Automation

I prefer the to use the term **operational** over automation. Yes, these tags are more likely to be used by a management tool than a human, but they can speak to the operation of the resource and for that reason, there is validity in seeing it as such. Common examples you might use/see:

  - **DecommissionBy/Expiry**: This is a date-based field that spells the end of a resource’s life. If you are really confident in your cloud skills, automate this with a tool like Cloud Custodian. Example: decommission => 2022-05-09
  - **PowerSchedule**: An identifier for when to power on/off the machine. This is a really simple way to cut down on hours of operation and save more money than alternative savings mechanisms. Example: PowerSchedule => WeekdaysOnly/0700-1900

## Things to consider

It is easy to get overwhelmed by the vast array of options and recommendations/best practices when it comes to tagging. The big cloud providers offer around a limit of 50 tags, but hitting this would likely drive you insane. When coming up with your hierarchy, I have two suggestions.

Firstly, think about what filters/dials/controls you would like on your reporting. If understanding the difference between dev and production environment costs is important, then include it. Likewise, if you’d like to know how much your staff or teams are spending, use that. Try not to double up on things you can find out elsewhere, like ‘Region’ or instance family/OS. This advice goes against the GSA standard, but I have yet to see a good reason why people should go through such redundancy.

Secondly, think about how you’d like to operationalise your cloud. Take, for example, decommissioning. A large portion of cloud costs can be allocated to things that linger. Using expiration-based tags, you can control your cloud environment to delete things that are past their use-by date. Perhaps, it might be a good idea to automate that to not operate where environment => production.

A final thing to consider, tags are more than just the key part. Their value (i.e., the second part of the group) is useless if not normalised or consistent. Let's take the most basic example: ‘environment’. You might find engineers tag a development environment as dev, development or maybe even dv. These all read the same to a human, but will massively complicate querying when it comes to generating a report. The way productive engineers solve this is through the creation of a controlled vocabulary. Once defined, compliance must be a routine part of a cloud operation, and cleaning up invalid values should rank highly on your list of tasks.

## Summary

Above are just a few simple examples of how to start thinking about your cloud tagging ventures. Like all things, the more effort you put into it, the better the opportunities for reporting and cost savings you will have later.  In the future, we will discuss things like compliance.
