---
title:  A guide to anonymising public cloud billing data
author: william
date:   2022-06-29 23:05:01 +1000
categories: [finops, aws]
tags: [finops, aws]
---

There are times when you may want to share your public cloud billing data files but can't do so for fear of leaking private data. Previously you may have manually deleted, redacted, or changed individual records to anonymise.  Fortunately, moving ahead there is a more reliable process that I will outline below, and it works for any tabular (CSV) public cloud billing data files.

The example below will anonymise the AWS Cost and Usage report, but it could just as easily be used for any other provider file.

### Preparation

To get started, you will need to have a working installation of [Cure](https://www.github.com/williamthom-as/cure) (either install the gem or run under Docker). Cure requires two things, a descriptive template file and a source CSV file (like the one from your provider).

You will also need a copy of the CSV file you want to transform.

### Template

Getting started with your template file is easy, you just need to define two things, a list of candidate transformations, and a collection of placeholders

```json
{
  "candidates" : [],
  "placeholders" : {}
}
```

**Candidates** are a list of column transformations that you wish to undertake on the file. By default, no definition means no transformation; it will appear in the output file how it came in. You will likely find many columns will require no transformation, which makes life a bit easier.

For the columns that you wish to translate, you will need to specify a candidate for each. Lets discuss the simplest possible example below.

```json
    {
      "column" : "identity/LineItemId",
      "translations" : [{
        "strategy" : {
          "name": "full",
          "options" : {}
        },
        "generator" : {
          "name" : "character",
          "options" : {
            "length" : 52,
            "types" : [
              "lowercase", "number"
            ]
          }
        }
      }]
    }
```

Before we get started, a quick summation of the above data structure, carry on to the Implementation section if you are familiar.

**Column**: Single string property that must match the column in your file.

**Translations**: An array of translations to be made on the column. A translation is made up of:
  - **Strategy**: A strategy is responsible for deciding how the translation is completed; it may be either:
    - ```full```: Entire record will be replaced.
    - ```regex, startwith, endwith, split```: can either replace the match, or replace the whole record **if** there is a match. 
      - **Regex**: if the regex has a match, either replace the matched data or replace the entire record. If there is no match, it is untouched.
      - **(Start,End) With**: if the property (start,end)s with, either replace the matched data or replace the entire record. If there is no match, it is untouched.
    - ```split```: split record on a chosen character and replace a specific index with value. If there is no split, it is untouched.
  - **Generator**: The generator is responsible for creating the replacement value.  There are many examples of these, including:
    - ```random (hex|number|character)``` sequences [ex. "D3C4F", "34545", "34hjsdh"]
    - ```guid``` [ex. 2f06264b-fe6f-4eba-932f-16107b3b11ed]
    - ```redact``` [ex. "xxxx"]
    - ```faker``` Full support for [Faker](https://www.github.com/faker-ruby/faker) values.
    - ```placeholder``` Performs lookup from a list of placeholders (controlled vocabulary) of options.

Looking at the above example, we can see that on column **identity/LineItemId**, we will perform one translation; a **full** replacement with a string of **52 lowercase** and **number** characters.

### Getting started

Of the 138+ columns inside a CUR, the main identifying columns are "identity/LineItemId", "bill/PayerAccountId", "lineItem/UsageAccountId", "lineItem/ResourceId", and any personal or AWS tags (for example: "resourceTags/aws:createdBy").

Below is a simple outline on how to generate a template file for processing, deconstructed into individual columns.

#### identity/LineItemId

The default value for this column is a random string of 52 characters [example: fbfb7zyl...va9wsb], which makes it pretty easy to replace.

```json
    {
      "column" : "identity/LineItemId",
      "translations" : [{
        "strategy" : {
          "name": "full",
          "options" : {}
        },
        "generator" : {
          "name" : "character",
          "options" : {
            "length" : 52,
            "types" : [
              "lowercase", "number"
            ]
          }
        }
      }]
    }
```

#### bill/PayerAccountId

The default value for this column is your AWS Payer Account number, which will be the same value for all rows.  Cure has a history store of previously generated values, every single time we make a replacement, we lookup the value to see if a generated value exists already. This grants integrity to existing data relationships and allows your bill to be just as functional as it was prior to transformation.

This means generating a new AccountId in the "bill/PayerAccountId" column will be reused in the "lineItem/ResourceId" when we do a partial replace on the account number in the ARN.

Option 1. Use a placeholder lookup.  Do this if you have a particular number in mind.

```json
    {
      "column" : "bill/PayerAccountId",
      "translations" : [{
        "strategy" : {
          "name": "full",
          "options" : {}
        },
        "generator" : {
          "name" : "placeholder",
          "options" : {
            "name" : "$account_number"
          }
        }
      }]
    }
```

Option 2. Randomly generate a 12 digit number

```json
    {
      "column" : "bill/PayerAccountId",
      "translations" : [{
        "strategy" : {
          "name": "full",
          "options" : {}
        },
        "generator" : {
          "name" : "number",
          "options" : {
            "length" : 12
          }
        }
      }]
    }
```

#### identity/LineItemId

The default value for this column is your AWS Account number from which the service was used. This will include multiple numbers if you have a multi account strategy. 

```json
    {
      "column" : "lineItem/UsageAccountId",
      "translations" : [{
        "strategy" : {
          "name": "full",
          "options" : {}
        },
        "generator" : {
          "name" : "number",
          "options" : {
            "length" : 12
          }
        }
      }]
    }
```

#### lineItem/ResourceId

The default value for this column is likely either an instance (i-12345678901234567), volume (vol-12345678901234567), ARN (arn:partition:service:region:account-id:resource-type:resource-id), S3 bucket names (mybucket) or blank. 

For this, we need to have a list of transformations since one size doesn't fit all.  Additionally, if it is blank, Cure will ignore it.  As you see in the below example, this will use multiple different strategies and generators.  Keeping in mind that Cure will only operate on a value when it needs to.  If it doesn't match, it will continue on to the end.

You will also note we have a no match translation field here.  This is important, as if there is no match after all attempts, we can opt to change it to a random value.



```json
    {
      "column" : "lineItem/ResourceId",
      "translations" : [{
        "strategy" : {
          "name": "regex",
          "options" : {
            "regex_cg" : "^i-(.*)"
          }
        },
        "generator" : {
          "name" : "hex",
          "options" : {
            "length" : 10
          }
        }
      },{
        "strategy" : {
          "name": "regex",
          "options" : {
            "regex_cg" : "^vol-(.*)"
          }
        },
        "generator" : {
          "name" : "hex",
          "options" : {
            "length" : 10
          }
        }
      },{
        "strategy" : {
          "name": "split",
          "options" : {
            "token": ":",
            "index": 4
          }
        },
        "generator" : {
          "name" : "number",
          "options" : {
            "length" : 12
          }
        }
      },{
        "strategy" : {
          "name": "split",
          "options" : {
            "token": ":",
            "index": -1
          }
        },
        "generator" : {
          "name" : "faker",
          "options" : {
            "module" : "App",
            "method" : "name"
          }
        }
      }],
      "no_match_translation" : {
        "strategy" : {
          "name": "full",
          "options" : {}
        },
        "generator" : {
          "name" : "hex",
          "options" : {
            "length" : 10,
            "prefix" : "s3_bucket_"
          }
        }
      }
    }
```

#### resourceTags:/*

You will need to configure these on your own, as I do not know the format this information is in, but use the preceeding logic to help.

### Execution

Once you have your template sorted, you can run it via CLI (either install the gem or use Docker)

```
    $ cure -t /path/to/template.json -s /path/to/source_file.csv -o /output/folder
    
    ...
    
    I, [2022-06-22T23:24:17.950924 #226198]  INFO -- Cure: Exporting file to [/tmp/cure/csv_file] with 3632 rows
```

### Final thoughts

This is not an exhaustive guarantee to strip out sensitive data of your AWS CUR bill, but it covers off all the main ones for most scenarios.  

In the future I will provide a CloudFormation template to deploy a stack (S3, Lambda) that can duplicate your billing data, anonymise it and reupload to a new S3 bucket for your existing workflow.

Please let me know over on the [Github project](https://www.github.com/williamthom-as/cure) if you have any issues, or feature requests.