---
title:  Handling common CSV operations with Cure
author: william
date:   2024-06-12 20:05:01 +1000
categories: [csv, ruby, cure]
tags: [csv, ruby, cure]
---

## Introduction

One of the downsides of writing a utility like [Cure](https://www.github.com/williamthom-as/cure) that no one really uses is you can't rely on Google to remember how to do things. 
So, I've written this post to help me remember how to use it for both common and obscure tasks.

If you are unfamiliar with [Cure](https://www.github.com/williamthom-as/cure), it is a utility that helps you manipulate, clean, and export CSV files. It is written in Ruby, 
and uses a DSL to define the operations you want to perform on your data. 

Common use cases are to manipulate CSV files into other CSV files, or to ingest cleaned data into your application.
Unlike a lot of other tools, Cure is designed with complex and oddly formatted CSV files (think invoices that companies might print out) in mind.

This post assumes you have installed Cure, if you haven't, visit [Cure](https://www.github.com/williamthom-as/cure) for instructions/Dockerfile.

Full docs can be found [here](https://www.github.com/williamthom-as/cure/docs).

<a id="top"></a>

# Common Operations
1. [Joining multiple CSVs into one](#joining-sheets)
2. [Storing data on disk instead of in-memory](#storing-data-disk)
3. [Cataloging templates with metadata](#metadata)

# Extraction
4. [White/Blacklisting columns](#white-black-list)
5. [Extracting two different parts of a CSV file](#named-range-extraction)
6. [Using headers not found in first row](#ignoring-rows)
7. [Ignoring parts of a CSV](#ignoring-rows)

# Building
8. [Adding new columns and deriving data](#adding-rows)
9. [Copying data between columns](#copying-rows)
10. [Renaming or removing columns](#removing-rows)

# Cleaning
11. [Anonymising data](#anonymising-data)
12. [Replacing values with variables/placeholders](#replacing-values)

# Exporting
15. [Exporting data to a database instead of CSV](#exporting-data)
16. [Splitting a CSV into multiple smaller files](#splitting-csv-files)

# Projects and automation
17. [Creating a new project](#create-new)
18. [Automating common tasks with a script](#automating)

# Advanced
19. [Leveraging `call` in your templates](#using-procs)
20. [Maintaining state during transforms](#ignoring-rows)
21. [Keeping transforms between runs](#keeping-translations)


## Common Operations
# Joining multiple CSVs into one
<a id="joining-sheets"></a>

Imagine you had two CSV files, `user_spend.csv` and `users.csv`, and you wanted to join them into one file.

`users.csv`

| UserId | Name   |
| ------ | -------|
| 1      | Johnny |
| 2      | Tim    |

`user_spend.csv`

| UserId | Spend |
| ------ | ----- |
| 1      | 100   |
| 2      | 200   |

and you wanted `output.csv` to look like:

| UserId | Name   | Spend |
| ------ | ------ | ----- |
| 1      | Johnny | 100   |
| 2      | Tim    | 200   |


{% highlight ruby %}

# Snapshot of Cure config

USERS_SHEET = "users"
SPEND_SHEET = "user_spend"

sources do
  csv :pathname, Pathname.new("users.csv"), ref_name: USERS_SHEET
  csv :pathname, Pathname.new("user_spend.csv"), ref_name: SPEND_SHEET
end

extract do
  named_range name: "users_data", ref_name: USERS_SHEET
  named_range name: "spend_data", ref_name: SPEND_SHEET
end

query do
  with named_range: "users_data", query: <<-SQL
    SELECT 
      names.id as UserId,
      names.name as Name,
      spend_data.spend as Spend
    FROM users_data
    INNER JOIN spend_data ON users_data.id = spend_data.id
  SQL
end

export do
  terminal title: "Exported", limit_rows: 5, named_range: "users_data"
  csv file_name: "output", directory: "/tmp/cure", named_range: "users_data"
end

{% endhighlight %}

Your query step can be as complex as you like, and can include any number of joins, unions, or subqueries.

[Jump to Top](#top)

# Storing data on disk instead of in-memory
<a id="storing-data-disk"></a>

By default, Cure stores working data in an in-memory Sqlite3 database, but you can also store it on disk.

There are a few reasons you'd want to keep the database.
  - If your file is very, very big (gigabytes or larger). Although Cure is pretty good at streaming large files, it can still run out of memory.
  - If you want to keep the data between runs. By default, Cure will drop the table on initialisation, but you can change this behaviour to keep
  the translations between runs. Lets say you want to anonymise a group of invoices, but you want the same randomised account number between all files, 
  you can do this by keeping the database.

{% highlight ruby %}

# Snapshot of Cure config

database {
  persisted file_path: "path/to/db.sqlite3"     # will create if it doesn't exist.
  allow_existing_table true                     # on init will raise exception if the table exists
  drop_table_on_initialise false                # on init will drop the table if it exists
  trunc_table_on_initialise false               # on init will truncate the table if it exists
  trunc_translations_table_on_initialise false  # on init will truncate the translations table if it exists
}

{% endhighlight %}

[Jump to Top](#top)

# Cataloging templates with metadata
<a id="metadata"></a>

Cure allows you to add metadata to your templates to help you remember what they do, or to help others understand what they do.

This metadata can be searched.

{% highlight ruby %}

# Snapshot of Cure config
metadata do
  name "Anonymising AWS billing files"
  version 1
  comments "Anonymises the account numbers and service IDs in an AWS billing file"
  additional data: {
    created_date: "2024-01-01 00:00",
    author: "william"
  }
end
{% endhighlight %}

[Jump to Top](#top)

## Extraction

# White/Blacklisting columns
<a id="white-black-list"></a>

If you want to exclude or include columns you can use white/blacklisting.

{% highlight ruby %}

# Snapshot of Cure config

candidate do
  blacklist options: { columns: %w[col_a col_b] }
end

# or whitelist
candidate do
  whitelist options: { columns: %w[col_a col_b] }
end

{% endhighlight %}

# Extracting two different parts of a CSV file
<a id="named-range-extraction"></a>

If you have a CSV file that has two different parts, you can extract them separately.

|         |    **A**    |    **B**    |    **C**    |
| ------- | ------- | ------- | ------- |
| **1**   | **Employees** |         |         |
| **2**   | Name    | Position| Salary  |
| **3**   | John Doe| Manager | $60,000 |
| **4**   | Jane Smith| Developer | $50,000 |
| **5**   |         |       |      |
| **6**   | **Projects**  |         |         |
| **7**   | Project Name  | Deadline| Budget  |
| **8**   | Website Redesign | 2022-12-31 | $20,000 |
| **9**   | Mobile App    | 2023-06-30 | $50,000 |

{% highlight ruby %}

# Snapshot of Cure config
extract do
  named_range name: "employees", at: "A2:C4"
  named_range name: "projects", at: "A7:C9"
end

# ... export them to seperate files

export do
  csv file_name: "employees", directory: "/tmp/cure", named_range: "employees"
  csv file_name: "projects", directory: "/tmp/cure", named_range: "projects"
end

{% endhighlight %}

Note that the named range notation follows the same rules as Excel (`A1:B2` to specify a range).

[Jump to Top](#top)

# Using headers not found in first row
<a id="ignoring-rows"></a>

If you have headers in an obscure place, you can specify the row they are expected to be in.

|         |    **A**    |    **B**    |    **C**    |
|**1**    | John Doe| Manager | $60,000 |
|**2**    | Jane Smith| Developer | $50,000 |
|**3**    | **Name**| **Position**| **Salary**  |

{% highlight ruby %}

# Snapshot of Cure config
extract do
  named_range name: "employees", at: "A1:C2", headers: "A3:C3"
end
{% endhighlight %}

[Jump to Top](#top)

# Ignoring parts of a CSV
<a id="ignoring-rows"></a>

If you have rows you want to exclude, you can remove them with `including`.

Input:

| Name    | Position | Salary  |
| ------- | -------- | ------- |
| John Doe| Manager  | $60,000 |
|         |          |         |
| Jane Smith| Developer | $50,000 |
|         |          |         |
| Bob Johnson| Analyst | $45,000 |

Output:  

| Name    | Position | Salary  |
| ------- | -------- | ------- |
| John Doe| Manager  | $60,000 |
| Jane Smith| Developer | $50,000 |
| Bob Johnson| Analyst | $45,000 |

{% highlight ruby %}

# Snapshot of Cure config
extract do
  named_range name: "names" do
    rows {
      including(where: proc {|row| row.any? })
    }
  end
end

{% endhighlight %}

[Jump to Top](#top)

## Building

# Adding new columns and deriving data
<a id="adding-rows"></a>

As useless as a new empty column sounds, it can be used for a placeholder column to be used later. A common example of this may be if you want to add a variable to each row. For example, at the top of a spreadsheet, you may have a date, but you want to add that to each row.

In this example, we will use a translation with a proc to calculate the total cost of an item. Note proc's all get handled the cell source (default in this instance is 0), and the context of the row, which includes the row itself.

Input:

| Item     | Item Count | Item Cost |
| -------- | ---------- | --------- |
| Apples   | 10         | 1         |
| Bananas  | 15         | 3         |
| Cherries | 20         | 1.50      |

Output:

| Item     | Item Count | Item Cost | Total Cost |
| -------- | ---------- | --------- | ---------- |
| Apples   | 10         | 1         | 10         |
| Bananas  | 15         | 3         | 45         |
| Cherries | 20         | 1.50      | 30         |

{% highlight ruby %}

# Snapshot of Cure config

build do
  candidate column: "Total Cost" do 
    add options: { default_value: 0 } # optional
  end
end

transform do
  candidate column: "Total Cost" do
    with_translation { replace("full", force_replace: true).with("proc", execute: proc { |source, ctx|
      "#{(ctx.row[:"Item Count"].to_f * ctx.row[:"Item Cost"].to_f).round(2)}%" }
    )}
  end
end

{% endhighlight %}

[Jump to Top](#top)

# Copying data between columns
<a id="copying-rows"></a>

Self-explanatory, but you can copy data between columns.

| col_a |
|-------|
| a     |

changes to 

| col_a | col_a_copy |
|-------|------------|
| a     | a          |

{% highlight ruby %}

# Snapshot of Cure config

build do
  candidate(column: "col_a") do
    copy options: { to_column: "col_a_copy" }
  end
end

{% endhighlight %}
[Jump to Top](#top)


# Renaming or removing columns
<a id="removing-rows"></a>

Very self-explanatory, but you can rename or remove columns.

{% highlight ruby %}

# Snapshot of Cure config

# rename column
build do
  candidate column: "Tags" do
    rename options: { new_name: "system_tags" }
  end
end

# remove columns
build do
  candidate(column: "remove_this") { remove }
end

{% endhighlight %}

[Jump to Top](#top)

## Cleaning

# Anonymising data
<a id="anonymising-data"></a>

If you have sensitive data, you can anonymise it.

{% highlight ruby %}

# Snapshot of Cure config

# Inline proc to use against all vendor values.
rot13_proc = proc { |source, _ctx|
  source.gsub(/[^a-zA-Z0-9]/, '').tr('A-Za-z', 'N-ZA-Mn-za-m')
}

candidate named_range: "items", column: "vendor" do
  with_translation { replace("full").with("proc", execute: rot13_proc) }
end

{% endhighlight %}

It is important to note, once the vendor matches again from another row or column, it will be the same translated value.

`Rot13` is not a strong anonymisation technique, but it is a good example of how you can use a proc to achieve an outcome.

# Replacing values with variables/placeholders
<a id="replacing-values"></a>

You can replace values with variables extracted from the sheet, or from static placeholders.

Invoice date and total are extracted from the sheet, but the account number is a static placeholder.

This adds all of those columns to each row.

{% highlight ruby %}

# Snapshot of Cure config

extract do
  variable name: "invoice_date", at: "B1"
  variable name: "invoice_total", at: "G12"
end

build do
  candidate column: "invoice_date", named_range: "items" do
    add options: {}
  end

  candidate column: "invoice_total", named_range: "items" do
    add options: {}
  end

  candidate column: "account_number" do
    add options: { default_value: 0 }
  end
end

transform do
  candidate column: "invoice_date" do
    with_translation { replace("full").with("variable", name: "invoice_date") }
  end

  candidate column: "invoice_total" do
    with_translation { replace("full").with("variable", name: "invoice_total") }
  end

  candidate column: "account_number" do
    with_translation { replace("full").with("placeholder", name: :account_number) }
  end

  place_holders({account_number: 987_654_321})
end

{% endhighlight %}

[Jump to Top](#top)

## Exporting

# Exporting data to a database instead of CSV
<a id="exporting-data"></a>

Depending on the amount of data you are working with, there are several ways you might want to approach loading
data into a database. You might want to do batch inserts or just persist every single row, but importantly it doesn't
really change in principle of how to yield out that data.

The first part is to create a class (you could use a lambda/proc if you wanted to, it just needs to respond to `#call`)
to hold the logic.

`row_handler.rb`

{% highlight ruby %}

class RowHandler

  attr_reader :named_ranges

  def initialize
    @named_ranges = {}
  end

  def call(row, named_range)
    @named_ranges[named_range] = [] unless @named_ranges.key?(named_range)
    @named_ranges[named_range] << row
  end
end

{% endhighlight %}

{% highlight ruby %}

# Snapshot of Cure config

row_handler = RowHandler.new

export do
  yield_row proc: row_handler, named_range: "items"
  yield_row proc: row_handler, named_range: "staff"
end

{% endhighlight %}

The `RowHandler` class will store all the rows in memory, you could easily modify this to write to a file or a database,
either singlularly or batched. Note that the `named_range` is the key to access the rows in the `RowHandler` instance, we can store
all data in one instance, or we could hand them individual ones too if desired.

Since you create the `RowHandler` instance, you have full control of what its instatiated with, you can hand it a database connection
and off you go.

[Jump to Top](#top)

# Splitting a CSV into multiple smaller files
<a id="splitting-csv-files"></a>

Lets say you have a CSV that is 200,000 rows long. To make it easier to work with, you might want to split it into 10 files of 20,000 rows each.

{% highlight ruby %}

# Snapshot of Cure config

export do
  chunk_csv file_name_prefix: "my_file", directory: "/tmp/cure", chunk_size: 20_000
end

{% endhighlight %}

[Jump to Top](#top)

## Projects and automation
# Creating a new project
<a id="create-new"></a>

If you have Cure installed, creating a new project is as simple as running `cure new [name]`.

{% highlight bash %}

$ cure new [name]
$ cd [name]
$ cure generate template [name]
$ cure run [name]

{% endhighlight %}

[Jump to Top](#top)

# Automating common tasks with a script
<a id="automating"></a>

There are many ways to automate a Cure job, but the simplest creating a bash script.

Below is an example of a script that will run a simple translation template on all CSV files in a directory.

{% highlight ruby %}

#/usr/bin/env ruby

require "cure"
require_relative "../utilities/team_translator"

team_translator = TeamTranslator.new

# Inline initialisation
cure = Cure.init do
  transform do
    candidate column: "Date" do
      with_translation { replace("full").with("proc", execute:
        proc { |val, _ctx| Date.parse(val).strftime("%Y-%m-%d") }
      )}
    end

    candidate column: "Home Team" do
      with_translation { replace("full").with("proc", execute: team_translator)}
    end

    candidate column: "Away Team" do
      with_translation { replace("full").with("proc", execute: team_translator)}
    end
  end

  export do
    terminal title: "Exported", limit_rows: 30
    csv file_name: "nrl_source_transformed", directory: "input"
  end
end

["input/*.csv"].each do |file|
  cure.process(:path, file)
end

{% endhighlight %}

[Jump to Top](#top)

## Advanced
# Leveraging `call` in your templates
<a id="using-procs"></a>