---
title:  Transforming CSV files with Cure
author: william
date:   2023-04-06 22:05:01 +1000
categories: [csv, ruby]
tags: [csv, ruby]
---

## Introduction

Chances are that at some point you've been given a CSV file that you've wanted to transform, clean up or manipulate somehow prior to onboarding or importing the data. This may be as trivial as joining columns, stripping columns, validating records, randomising content or many other options. Rather than being bogged down in writing custom code to handle the task, [Cure](https://www.github.com/williamthom-as/cure) attempts to provide a 'low-code' solution. 

### Installation

Cure is a Ruby gem and can be installed in the usual way:

```ruby
gem install cure
```

There are also Docker options and more, which can be found [here](https://www.github.com/williamthom-as/cure/README.md).

### Template Guidelines

[Cure](https://www.github.com/williamthom-as/cure) is driven by templates, which can either be provided inline or stored in files. It can be run via a command line or inline.

Cure processes CSVs through a pipeline, each step is laid out below. You can opt in to all or as few as needed.

```ruby
extract do
 # ...
end

build do
 # ...
end

query do
 # ...
end

transform do
 # ...
end

export do
 # ...
end
```

#### Example

To explain the steps and look at some of the core features, we will walk through transforming a purchase order. This will perform some obfuscation of private data, removal of unnecessary columns, fixing some typos, calculating some new columns and outputting it to a new CSV in a nicer format.

![Screenshot from 2023-04-07 23-13-21](https://user-images.githubusercontent.com/8381190/230614909-9f014ec5-a581-4452-8651-9ed78067f5c2.png)

#### Extract

Extraction blocks allow you to specify the sections or properties in a spreadsheet that you want to do something to. There are two ways to set these:

- 'Named ranges' specify sections of the CSV to extract into a group. These can then be treated as individual sheets.

- 'Variables' are single field values that can be referenced in latter parts of the process.

If your CSV is already in the correct format for each row (target headers and rows make up the entire spreadsheet), you **do not** need to use extractions.

The pictures below show a **named range** of A4:G10:


![named_range](https://user-images.githubusercontent.com/8381190/230626090-a5159854-6643-4b5b-85b4-8fd9ebe1a756.png)


with a **variable** in B1 (invoice date) and G12 (invoice total):

![variables](https://user-images.githubusercontent.com/8381190/230625915-e625680b-355c-414b-888e-7bd718186a94.png)

These would be represented in the 'extract' block as:

```ruby
extract do
  named_range name: "items", at: "A4:G10", headers: "A4:F4"
  variable name: "invoice_date", at: "B1"
  variable name: "invoice_total", at: "G12"
end
```

#### Build

Build steps are used to manipulate the data structure at a high level; adding or removing single columns, white or blacklisting columns or converting JSON 'key => value' to individual columns.

Adding columns provides a new column that can be used for calculating values from other columns. In our example, we will add three columns; 'purchase_date', 'percentage_of_total' and 'code'

```ruby
build do
  candidate column: "purchase_date", named_range: "items" do
    add options: {}
  end

  candidate column: "percentage_of_total", named_range: "items" do
    add options: {}
  end

  candidate column: "code", named_range: "items" do
    add options: {}
  end
end
```

#### Query

> Note: Cure uses SQLite3 to store the spreadsheet as it is being transformed. It can either be stored in memory (default), or persisted to disk if the file being processed is particularly big. This was done as a far more memory friendly option when compared with the original Ruby data structures used.

Query blocks provide the ability to customize what data is selected before it is provided to transforms. Common usages may be group-by, summing, sorting, ordering or whatever else you can do in SQL.

```ruby
# We don't really need to define this, other than changing the order, 
# this is the same as the default value.

query do
  with named_range: "items", query: <<-SQL
    SELECT
      sku, 
      code, 
      item, 
      vendor,
      cost_per_kilo, 
      amount_in_kilo, 
      total_cost, 
      purchase_date,
      percentage_of_total
    FROM items
  SQL
end
```

#### Transforms

Transform blocks provide the ability to change the column value given. In the example case, a few transforms are needed.  They each require a bit of explaining, so have a look at the comments for each transform.

> **Note:** translations are stacked, and are called in order. The value of one translation is *passed* to the next. You can do one, or multiple translations, consisting of; full replacements, regex partial replacements, conditional replacements, appended or prepended. 
Finally, we can even do a no match translation - something to run if nothing else changed the value.

There are a bunch of generation strategies, random value generators, static values, uppercase, downcase, case switch generators, ERB templating, fully customisable proc generators [see below] and the list goes on.

Translations have an (opt-out) history, for example; if you generate an new account number in Column A, but the account number is referenced in Column B, it will keep the same translation value between the two. This is essential to ensure data integrity.

Observe the account number being maintained in RefereceNo column below:

| AccountNo | ReferenceNo  |
|-----------|--------------|
| 123456    | Ref-123456-1 |
| 123456    | Ref-123456-2 |

will translate to

| AccountNo | ReferenceNo  |
|-----------|--------------|
| 654321    | Ref-654321-1 |
| 654321    | Ref-654321-2 |



```ruby
transform do
  # A rather simple one, if the column "item" matches our typo - oarnge,
  # replace the whole amount with the static text 'orange.
  candidate named_range: "items", column: "item" do
    with_translation { replace("match", match: "oarnge").with("static", value: "orange") }
  end

  # Here are are doing a full replacement of whatever is in the SKU column 
  # with a random 8 digits. Important to note here: this has a history, if
  # 1234 changes to 5678, every instance of 1234 from here on will be changed to 1234.
  candidate named_range: "items", column: "sku" do
    with_translation { replace("full").with("number", length: 8) }
  end

  # This transform takes a previously empty field and creates a new code. 
  # It has two steps - 
  # 1. Create a full replacement with static text FRUIT-
  # 2. Append a random character of 3 random characters, either uppercase or numbers.
  #    The force replace flag says regardless of what the value may have been, replace it.
  candidate named_range: "items", column: "code" do
    with_translation { replace("full", force_replace: true).with("static", value: "FRUIT-") }
    with_translation { replace("append", force_replace: true).with("character", length: 3, types: %w[uppercase number]) }
  end

  # A simple transform, if you remember back to the extract step, we
  # pulled out a single cell "invoice_date". Here we are adding it to
  # each row.
  candidate named_range: "items", column: "purchase_date" do
    with_translation { replace("full").with("variable", name: "invoice_date") }
  end

  # This is one of the more advanced transforms we do. We want to do a custom 
  # calculation where we see the percentage of spend per line item against the
  # total cost.
  # 1. Since the invoice total is a variable, prefill the row with that value.
  # 2. We provide a proc for the calculation A/B * 100, rounded. The proc is 
  #    called with two variables, the source value (which we just set to be 
  #    the invoice total), and the row context.
  #    We grab the row "total cost", and use the source value to perform the 
  #    calculation.
  candidate named_range: "items", column: "percentage_of_total" do
    with_translation { replace("full", force_replace: true).with("variable", name: "invoice_total") }
    with_translation { replace("full", force_replace: true).with("proc", execute: proc { |source, ctx|
      "#{((ctx.row[:total_cost].to_f / source.to_f) * 100).round(2)}%" }
    )}
  end
  
  # Finally, the vendor needs to be obfuscated because it for some reason is secret.
  # We generate two translations, 
  candidate named_range: "items", column: "vendor" do
    with_translation { replace("full").with("character", length: 3, types: %w[uppercase]) }
    with_translation { replace("append").with("character", length: 3, types: %w[number]) }
  end
end
```

#### Exports

Exports allow you to output the results of the transformation. There are three main options currently, outputting to the terminal, outputting to CSVs (one or many), or yielding the row back to your program to do whatever you want.

Terminal output is really nice just to see the first few rows as you develop your script..

```ruby
export do
  terminal named_range: "items", title: "Preview", limit_rows: 10
  csv named_range: "items", directory: "/tmp/cure", file_name: "section_1.csv"
end
```

#### Result

Remembering what we started with...

**Before:**

![Screenshot from 2023-04-07 23-13-21](https://user-images.githubusercontent.com/8381190/230614909-9f014ec5-a581-4452-8651-9ed78067f5c2.png)

... and after all that, we have:

**After:**

**CSV**
![result](https://user-images.githubusercontent.com/8381190/230626158-aadd95af-89b4-46ae-aa44-24d8ac5b3daa.png)

**Terminal**
![Screenshot from 2023-04-08 00-36-25](https://user-images.githubusercontent.com/8381190/230626876-cadd7883-2421-43b8-950c-8e0a74b9a8da.png)
