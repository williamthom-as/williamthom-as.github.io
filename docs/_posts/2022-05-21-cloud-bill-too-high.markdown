---
title:  "A novel approach to understanding cloud spend"
author: william
date:   2022-05-21 00:00:00 +1000
categories: [pal, aws]
tags: [pal]
published: false
---

I personally have a pretty small monthly AWS cloud bill, but it still has tens of thousands of lines that I want to understand it fully. Following AWS standard advice, I found the weight and complexity with Athena/Quicksight to be too much (not to mention too expensive). 

So I wrote [Pal](https://www.github.com/williamthom-as/pal) in my spare time to provide 80% of the intelligence with 20% of the effort. If you don't know where to start, have a look at some of the templates you could use, or write some of your own.  

The cool thing about templates are they are shareable, so if you come up with a novel idea let me know.

### AWS Templates

#### EC2

[Spend Breakdown by EC2 Product](https://github.com/williamthom-as/pal/blob/main/templates/aws/ec2/ec2_spend_breakdown.json)

[EC2 Hourly Spend Breakdown](https://github.com/williamthom-as/pal/blob/main/templates/aws/ec2/ec2_compute_hourly_breakdown.json)

[EC2 Operation Breakdown](https://github.com/williamthom-as/pal/blob/main/templates/aws/ec2/ec2_operation_breakdown.json)

[Existing RI Expiry Dates](https://github.com/williamthom-as/pal/blob/main/templates/aws/reserved_instances/all_reserved_instance_expiries.json)

#### KMS

[List KMS Keys](https://github.com/williamthom-as/pal/blob/main/templates/aws/kms/list_of_kms_keys.json)

[Last KMS Charge](https://github.com/williamthom-as/pal/blob/main/templates/aws/kms/last_charge_kms.json)

#### Data Transfer

[Data Transfer Breakdown To/From](https://github.com/williamthom-as/pal/blob/main/templates/aws/data_transfer/data_transfer_breakdown.json)

#### Summaries

[Resource/Usage Total Cost Summary](https://github.com/williamthom-as/pal/blob/main/templates/aws/global_resource_and_usage_type_costs.json)

More to come!
