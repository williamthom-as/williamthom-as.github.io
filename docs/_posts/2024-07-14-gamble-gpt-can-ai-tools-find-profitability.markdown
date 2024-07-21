---
title:  GambleGPT or can AI tools help find profitability in sports betting markets?
author: william
date:   2024-07-21 21:05:00 +1000
categories: [csv, ruby, cure, gpt, ai]
tags: [ruby, cure, gpt, ai]
---

## Background

In the past few months I've been hit with news article after blog post after social media post about "how AI is going to take all software engineers jobs" eventually. 
I'm pretty cynical of the claims, and other than a few cool demos, like most I've been underwhelmed and oddly sick of hallucinated answers.

So, like any reasonable developer, I've come to the conclusion that I'm going to have a bet both ways; *if* AI can take my job, maybe it can help secure me some side income via 
the distingushed money making method known as 'sports gambling'. Plus, hey, we know its possible, check out this [fellow distingushed Australian](https://en.wikipedia.org/wiki/David_Walsh_(art_collector)).

To set this up, I've chosen Australian Ruby League as the sport for two reasons;

1. We are heading towards the end of the season, so there should be enough data from this year to get a reasonable answer.
2. I've found a dataset that covers all games and outcomes from 2009 to a few days ago.

I will compare the results of the AI to two other methods to evaluate the effectiveness;

1. A seasoned sports tipper
2. My wife's uneducated guesses

## The Plan

There are many, many ways to approach this problem, but I am going to keep it simple.

I will:

1. Get the data.
2. Clean and load the data into a database.
3. Ask the AI to generate SQL queries to generate a teams performance, across multiple domains, and rank them against eachother.
4. I will use historical data to test the performance of the AI, once it seems reasonable, I will load current data for the coming week.
5. Place bet on higher ranked team.

> **Note**: Firstly, Don't take this post too seriously. I am not a gambler, and I certainly don't recommend it. However, I need to prove the results are real, and the only to do this is to place a nominal bet of $1 on each game.
> I mean otherwise I could just cook the books and make it look like AI is actually capable.

With all that in mind, off we go!

## Hypothesis

I don't have high hopes. I think it will be terrible, inaccurate, and outperformed by all three other methods. Quite frankly, I'll take valid SQL queries as a win.

## The Experiment

#### Step 0: Setting up the environment

I need to have an environment that I can use to run the suggestions from the AI. I've got some tools I am very familiar, but in principle if you wanted to conduct your own experiment, 
you can do whatever you find works best.

Since I've got a CSV as my source data, I am going to use [Cure](https://www.github.com/williamthom-as/cure), a tool I wrote to load and transform the data. Once its loaded, Cure allows
me to execute arbitrary SQL queries against the data, which is perfect for this experiment.

I'll also need to visualise the results, so I'll use (suprise!) [Cure Viz](https://www.github.com/williamthom-as/cure-viz), to generate some graphs and tables for assessment.

If you want a copy of the code, you can find it [here](https://www.github.com/williamthom-as/gamble-gpt).

#### Step 1: Get the data

Fortunately, I've found a pretty good source for data. All games from 2009 to today is pretty neat. I found it here at [Historical NRL Results and Odds Data](https://www.aussportsbetting.com/data/historical-nrl-results-and-odds-data/)

#### Step 2: Clean and load the data

Setting up the environment is pretty easy. If you don't care about this stuff [jump to the next step](#step-3)

```ruby
➜  ~/dev/ruby cure new gamble_gpt        
[INFO] Creating new project: gamble_gpt
[INFO] Creating directory /home/william/dev/ruby/gamble_gpt
[INFO] Creating directory /home/william/dev/ruby/gamble_gpt/input
[INFO] Creating directory /home/william/dev/ruby/gamble_gpt/output
... snip ...
```

Looking through the data, I can see that the team names are not consistent, so I've written a preload script. 

Place the CSV in the `input` directory and run the following script.

**Pre-process**

```ruby
require "cure"

class TeamTranslator
  def call(val, _ctx)
    return val unless team_map.has_key? val

    team_map[val]
  end

  def team_map
    {
      "Canterbury-Bankstown Bulldogs" => "Canterbury Bulldogs",
      "Cronulla-Sutherland Sharks" => "Cronulla Sharks",
      "Manly-Warringah Sea Eagles" => "Manly Sea Eagles",
      "North QLD Cowboys" => "North Queensland Cowboys",
      "St. George Illawarra Dragons" => "St George Dragons"
    }
  end
end

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
    csv file_name: "nrl_source_transformed", directory: "input"
  end
end

cure.process(:path, "input/nrl_source.csv")
```

**Working script**

Check the comments to see whats going on, long story short we are just allowing for the base data to be loaded.

```ruby
require "cure"
require "cure/viz/viz_base"

require_relative "../utilities/row_handler"

row_handler = RowHandler.new

home_team = "Sydney Roosters"      # placeholders
away_team = "New Zealand Warriors" # placeholders

cure = Cure.init do
  extract do
    # Pull all data into history table
    named_range name: "history", at: -1 
  end

  query do
    # Extract all the data from the history table 
    with named_range: "history", query: <<-SQL
      SELECT *
      FROM history
    SQL
  end

  export do
    # Show the first 30 rows to the terminal.
    terminal title: "Exported", limit_rows: 30, named_range: "history"
  end
end

# Run the process on the transformed file.
cure.process(:path, "input/nrl_source_transformed.csv")

```

<a id="step-3"></a>

#### Step 3: Ask the AI to generate SQL queries

I will save you all the boring back and forth, but the initial prompt given to CoPilot was:

> You are a sports analyst and you have been given a dataset of all NRL games from 2009 to today. 
> You need to generate SQL queries that ranks the teams based on their performance across multiple domains.
>
> The columns of data you have to work with are: [Date,Kick-off (local),Home Team,Away Team,Venue,Home Score,Away Score <...and more>]

to which we got.. 

> To rank the teams based on their performance, we can consider the number of games won by each team, both as a home team and an away team. We can also consider the total scores made by each team. Here is a step-by-step plan:
>
> [insert rambling about design...]
>
> Here is the SQL query that implements this plan:
> 
> ```sql
> SELECT 
>    COALESCE(home_wins.team, away_wins.team) AS team,
>    COALESCE(home_wins.wins, 0) + COALESCE(away_wins.wins, 0) AS total_wins,
>    COALESCE(home_scores.total_score, 0) + COALESCE(away_scores.total_score, 0) AS total_scores
> FROM 
>    (SELECT "Home Team" AS team, COUNT(*) AS wins
>    FROM nrl_source
>    WHERE "Home Score" > "Away Score"
>    GROUP BY "Home Team") AS home_wins
> FULL OUTER JOIN 
>    (SELECT "Away Team" AS team, COUNT(*) AS wins
>    FROM nrl_source
>    WHERE "Away Score" > "Home Score"
>    GROUP BY "Away Team") AS away_wins
> ON home_wins.team = away_wins.team
> LEFT JOIN 
>   (SELECT "Home Team" AS team, SUM("Home Score") AS total_score
>    FROM nrl_source
>    GROUP BY "Home Team") AS home_scores
> ON home_wins.team = home_scores.team
> LEFT JOIN 
>    (SELECT "Away Team" AS team, SUM("Away Score") AS total_score
>    FROM nrl_source
>    GROUP BY "Away Team") AS away_scores
> ON home_wins.team = away_scores.team
> ORDER BY total_wins DESC, total_scores DESC;
> ```

This initial query was very bad. It doesn't really get us too far. So I pivoted with targeted queries. 
After some initial research (and even some of my own thoughts), I found some common ideas when ranking a team in a sports league. 

Lets look at: 

1. Historical games together
2. Last game results - home/away team
4. How often the bookies are wrong on the team
5. Ladder position
6. Winning streak (last 5 or so games)
7. Win rate against top teams

To spare you a long post, I'll just show the SQL queries that were generated, and not the arm wrestling
with the AI to generate something useful.

A small background note, the tool I am using, Cure, allows me to run any number of queries against the data, and then collect all the results to pass off to a performance calculator and visualisation builder.
The code snippets you see below are just the way I get Cure to run the queries.

#### Historical games together

I was pretty impressed with this query, it was prompted to calculate an exponential score for the last 6 games played, decreasing in "value" as the games went historical.

This means that more recent wins held more value than older wins. 

```sql
  query do
    with named_range: "games_together", query: <<-SQL
      SELECT Date, `Home Team`, `Home Score`, `Away Team`, `Away Score`,
      CASE 
      WHEN CAST(`Home Score` AS INTEGER) > CAST(`Away Score` AS INTEGER) THEN `Home Team`
      WHEN CAST(`Home Score` AS INTEGER) < CAST(`Away Score` AS INTEGER) THEN `Away Team`
      ELSE 'Draw'
      END as Winner,
      CASE
      WHEN ROW_NUMBER() OVER 
        (ORDER BY Date DESC) <= 6 THEN POWER(2, 2 - ROW_NUMBER() OVER (ORDER BY Date DESC))
      ELSE 0.05
      END as Weight
      FROM history
      WHERE (`Home Team` = '#{home_team}' AND `Away Team` = '#{away_team}') OR
        (`Home Team` = '#{away_team}' AND `Away Team` = '#{home_team}')
      ORDER BY Date DESC
    SQL

    # ... rest
```

#### Last game results - home/away team

Pretty self explanator, this query finds the point difference of the last games in the year.
We can then use the accumulation of the point difference to rate the performance of the team.

A positive number would be good, and a negative number shows the team is likely outperformed regularly.

The query is run twice, once for the home team, and once for the away team.

```sql
  # ...
  with named_range: "last_games_home", query: <<-SQL
    SELECT 
      Date, 
      `Home Team`, 
      `Away Team`, 
      CAST(`Home Score` AS INTEGER) AS `Home Score`, CAST(`Away Score` AS INTEGER) AS `Away Score`,
    CASE
      WHEN `Home Team` = '#{home_team}' 
        THEN CAST(`Home Score` AS INTEGER) - CAST(`Away Score` AS INTEGER)
      ELSE CAST(`Away Score` AS INTEGER) - CAST(`Home Score` AS INTEGER)
    END as PointDifference
    FROM history
    WHERE (`Home Team` = '#{home_team}' OR `Away Team` = '#{home_team}') AND strftime('%Y', Date) = '2024'
    ORDER BY Date DESC
  SQL
  # ...
```

#### How often the bookies are wrong for the team

Full transparency, this one came during a discussion with CoPilot about novel approaches to finding
winners, I think its garbage. Indeed, in testing, it showed very little correlation to the game outcome.

I've left it here because maybe it has value to someone, it was one of the more complex queries it wrote.

```sql
  SELECT 
      total_games.team, 
      total_games.total as total, 
      IFNULL(wrong_predictions.count, 0) AS count,
    (CAST(wrong_predictions.count AS float) / CAST(total_games.total AS float)) as relative_count
  FROM (
    SELECT team, COUNT(*) AS total
    FROM (
      SELECT `Home Team` as team
      FROM history
      UNION ALL
      SELECT `Away Team` as team
      FROM history
    ) as total_games
    GROUP BY team
  ) as total_games
  LEFT JOIN (
    SELECT team, COUNT(*) AS count
    FROM (
      SELECT `Home Team` as team
      FROM history
      WHERE (`Home Score` < `Away Score` AND `Home Odds` < `Away Odds`)
      UNION ALL
      SELECT `Away Team` as team
      FROM history
      WHERE (`Away Score` < `Home Score` AND `Away Odds` < `Home Odds`)
    ) as wrong_predictions
    GROUP BY team
  ) as wrong_predictions
  ON total_games.team = wrong_predictions.team
```

#### Ladder position

The logical thing to do would be just load a ladder from a scraped webpage. But, alas this project had
time constraints so generating it via SQL is the only way forward!

It did a pretty crappy job, it doesn't take bye weeks into account and I'm pretty sure it doesn't even
calculate the correct values fullstop. BUT, its all relative. If it doesn't give the right points for each
situation (win/lose/draw), its at the very least applied evenly for all teams. 

Does it help? Maybe, we will see later on.

```sql
  with named_range: "ladder", query: <<-SQL
    SELECT team, SUM(points) as total_points,
            SUM(win) as Win, SUM(lose) as Lose, SUM(draw) as Draw,
            SUM(home_score) - SUM(away_score) as PointDifference
    FROM (
        SELECT `Home Team` as team,
            SUM(CASE
                WHEN `Home Score` > `Away Score` THEN 2
                WHEN `Home Score` = `Away Score` THEN 1
                ELSE 0
            END) as points,
            SUM(CASE
                WHEN `Home Score` > `Away Score` THEN 1
                ELSE 0
            END) as win,
            SUM(CASE
                WHEN `Home Score` < `Away Score` THEN 1
                ELSE 0
            END) as lose,
            SUM(CASE
                WHEN `Home Score` = `Away Score` THEN 1
                ELSE 0
            END) as draw,
            SUM(`Home Score`) as home_score, SUM(`Away Score`) as away_score
        FROM history
        WHERE strftime('%Y', Date) = '2024'
        GROUP BY `Home Team`
        UNION ALL
        SELECT `Away Team` as team,
            SUM(CASE
                WHEN `Away Score` > `Home Score` THEN 2
                WHEN `Away Score` = `Home Score` THEN 1
                ELSE 0
            END) as points,
            SUM(CASE
                WHEN `Away Score` > `Home Score` THEN 1
                ELSE 0
            END) as win,
            SUM(CASE
                WHEN `Away Score` < `Home Score` THEN 1
                ELSE 0
            END) as lose,
            SUM(CASE
                WHEN `Away Score` = `Home Score` THEN 1
                ELSE 0
            END) as draw,
            SUM(`Away Score`) as home_score, SUM(`Home Score`) as away_score
        FROM history
        WHERE strftime('%Y', Date) = '2024'
        GROUP BY `Away Team`
    )
    GROUP BY team
    ORDER BY total_points DESC
  SQL
```

#### Winning streak (last 5 or so games)

This is an underrated concept. A team often performs better the more it performs better (known as 'performance recursion').  No, I don't have a source for that, but it sounds good and actually plays out as a pretty strong correlation when testing with our data set.

I was actually impressed at CoPilot here, it took a pretty loose prompt `Calculate the winning streak of the team` and delivered a reasonable query. I like the use of `ROW_NUMBER` and partitioning. Good.

```sql
  with named_range: "winning_streak", query: <<-SQL
    SELECT `Home Team` AS Team, MAX(Streak) AS LongestWinStreak
    FROM (
        SELECT `Home Team`, `Date`, COUNT(*) AS Streak
        FROM (
            SELECT `Home Team`, `Date`,
              ROW_NUMBER() OVER(PARTITION BY `Home Team` ORDER BY `Date`) -
              ROW_NUMBER() OVER(PARTITION BY `Home Team`, `Home Score` > `Away Score` ORDER BY `Date`) as grp
            FROM history
            WHERE `Home Score` > `Away Score` AND strftime('%Y', Date) = '2024'
        ) t
        GROUP BY `Home Team`, grp
    ) t
    GROUP BY `Home Team`
  SQL
```

#### Win rate against top teams

This is another query that CoPilot largely invented itself when prompting for 'secret queries to outperform the competition'. It looks at the win rate of a team when playing stronger teams.

Its a bit confusing, but hey, if you don't understand it you can always copy and paste it into your preferred tool and prompt it with "Explain this junk query like I'm 5".

```sql
  with named_range: "win_rate_against_top_teams", query: <<-SQL
    SELECT `Home Team` AS Team, 
      COUNT(CASE WHEN `Home Score` > `Away Score` THEN 1 END) * 100.0 / COUNT(*) AS WinRateAgainstTopTeams
    FROM history
    WHERE `Away Team` IN (
        SELECT Team
        FROM (
            SELECT `Home Team` AS Team, COUNT(CASE WHEN `Home Score` > `Away Score` THEN 1 END) AS Wins
            FROM history
            GROUP BY `Home Team`
        )
        ORDER BY Wins DESC
        LIMIT 5
    )
    GROUP BY `Home Team`
  SQL
```

#### Step 4. Turning queries into actionable bets.

Having the queries was great, but not all of them presented data in a useful way. So I started to think of
approaches I could take to join them all together. 

There are a tonne of methods you could do to achieve this, but I chose to use a simple weighted average.
I don't have a PhD in stats, so I'm not going to pretend I know the best way to do this.

After some experimentation, my approach looked like:

1. Take each input and normalise it to a value between 0-1.
2. Add each input together. The bigger number would be the team to bet on.
3. Include/exclude various inputs, tweak weights and check against historical data to see which variation of the model worked best.
4. Export all the data to a dashboard for each run so I could audit the results.

Using this very simple approach, I came up with three weightings.

```ruby
  def perform
    home_pd, away_pd = calc_point_differences
    home_gt, away_gt = calculate_games_together
    home_lp, away_lp = calculate_ladder_points
    home_ws, away_ws = calculate_winning_stream
    home_bk, away_bk = calculate_bk
    home_wr, away_wr = calculate_win_rate
    
    home_wt_one = (home_gt + home_pd + home_lp + home_ws + home_bk + home_wr).round(4)
    away_wt_one = (away_gt + away_pd + away_lp + away_ws + away_bk + away_wr).round(4)
    
    home_wt_two = (home_gt + home_pd + home_lp + home_ws + home_wr).round(4)
    away_wt_two = (away_gt + away_pd + away_lp + away_ws + away_wr).round(4)
    
    home_wt_three = (home_gt + (home_pd * 1.25) + home_wr).round(4)
    away_wt_three = (away_gt + (away_pd * 1.25) + away_wr).round(4)
    
    # ... Psst, full code sample is on my GitHub
  end
```

After 10 minutes of testing, it was obvious weighting 3 was the best. How funny that it uses the least amount of inputs.

I will provide the links to each of the dashboards, but if you are curious they look like this:

![image](https://github.com/user-attachments/assets/2d0ca9af-8bac-4aa0-964e-15c932936a5c)

#### Step 5. Place bet on higher ranked team

As mentioned, we are up to week 20 of the NRL season, so I've loaded the weeks games and run the model on each. The predictions are as follows:

<div class="table-container" markdown="block">

| Home Team         | Away Team             | Home Weight   | Away Weight   | GPT Predicted   | Seasoned Tipper | Wife |
|---|---|---|---|---|---|---|
| Canberra Raiders  | New Zealand Warriors  | 1.6549        | 1.5951        | **Canberra Raiders**    | Canberra Raiders | New Zealand Warriors |
| South Sydney Rabbitohs  | Wests Tigers    | 1.8656	      | 1.3844        | **South Sydney Rabbitohs** | South Sydney Rabbitohs | South Sydney Rabbitohs |
| Newcastle Knights | Brisbane Broncos      |	1.5324	      | 1.8009        | **Brisbane Broncos**  | Brisbane Broncos | Newcastle Knights |
| Melbourne Storm   | Sydney Roosters       | 1.9227	      | 1.3273        | **Melbourne Storm**  | Sydney Roosters | Sydney Roosters |
| Penrith Panthers  | Dolphins              | 2.6874	      | 0.5626        | **Penrith Panthers**  | Penrith Panthers | Penrith Panthers |
| Manly Sea Eagles  | Gold Coast Titans     | 11.6075	      | -8.3575       | **Manly Sea Eagles**  | Manly Sea Eagles | Gold Coast Titans |
| North QLD Cowboys | Canterbury Bulldogs   | 0.9126	      | 2.3374        | **Canterbury Bulldogs** | Canterbury Bulldogs | North QLD Cowboys |  

</div>

**Week 20 Dashboards**

- Game 1: [Canberra Raiders vs New Zealand Warriors](https://xyare.com/dashboard/viewer/remote?gistId=28386b4a992a5d9f60b909e95a7723e1)
- Game 2: [South Sydney Rabbitohs vs Wests Tigers](https://xyare.com/dashboard/viewer/remote?gistId=8d571d33f4e77604e95c149b9be39ce0)
- Game 3: [Newcastle Knights vs Brisbane Broncos](https://xyare.com/dashboard/viewer/remote?gistId=a452616d0016103bfe7233823bf6f9d4)
- Game 4: [Melbourne Storm vs Sydney Roosters](https://xyare.com/dashboard/viewer/remote?gistId=28e06f6897b5f1914941ea1f9e2538a0)
- Game 5: [Penrith Panthers vs Dolphins](https://xyare.com/dashboard/viewer/remote?gistId=7a5a783e610fb6fec26d1ab59391eb88)
- Game 6: [Manly Sea Eagles vs Gold Coast Titans](https://xyare.com/dashboard/viewer/remote?gistId=0c41d01536852e1a74adf0d9426196fc)
- Game 7: [North QLD Cowboys vs Canterbury Bulldogs](https://xyare.com/dashboard/viewer/remote?gistId=2febb1bdc709365efa49acb5d121e33b)

## Results

Note: **Bold** entries denote correct predictions.

<div class="table-container" markdown="block">

| Home Team         | Away Team             | Winner | GPT Predicted   | Seasoned Tipper | Wife |
|---|---|---|---|---|---|
| Canberra Raiders  | New Zealand Warriors  | Canberra Raiders | **Canberra Raiders**    | **Canberra Raiders** | New Zealand Warriors |
| South Sydney Rabbitohs  | Wests Tigers    | South Sydney Rabbitohs | **South Sydney Rabbitohs** | **South Sydney Rabbitohs** | **South Sydney Rabbitohs** |
| Newcastle Knights | Brisbane Broncos      | Brisbane Broncos | **Brisbane Broncos**  | **Brisbane Broncos** | Newcastle Knights |
| Melbourne Storm   | Sydney Roosters       | Melbourne Storm | **Melbourne Storm**  | Sydney Roosters | Sydney Roosters |
| Penrith Panthers  | Dolphins              | Penrith Panthers | **Penrith Panthers**  | **Penrith Panthers** | **Penrith Panthers** |
| Manly Sea Eagles  | Gold Coast Titans     | Manly Sea Eagles | **Manly Sea Eagles**  | **Manly Sea Eagles** | Gold Coast Titans |
| North QLD Cowboys | Canterbury Bulldogs   | North QLD Cowboys|  Canterbury Bulldogs | Canterbury Bulldogs | **North QLD Cowboys** |
| **Total Correct** |                       |                 | **6**               | **5**               | **3**             |

</div>

From the results, we can see that the AI outperformed the seasoned tipper and my wife's guesses. 6 out of 7 is a result I didn't anticipate. 

As for the betting outcomes, I placed a $1 bet on each game, and the results are as follows:


<div class="table-container" markdown="block">

| Game                      | Odds  |
|---------------------------|-------|
| Canberra Raiders vs New Zealand Warriors | +1.73 |
| South Sydney Rabbitohs vs Wests Tigers | +1.31 |
| Newcastle Knights vs Brisbane Broncos | +1.60 |
| Melbourne Storm vs Sydney Roosters | +2.15 |
| Penrith Panthers vs Dolphins | +1.21 |
| Manly Sea Eagles vs Gold Coast Titans | +1.45 |
| North QLD Cowboys vs Canterbury Bulldogs | -1.00 |
| &nbsp; | &nbsp; |
| **Total amount bet** | -$7.00 |
| **Total amount lost** | $-1.00 |
| **Total amount won** | $9.45 |
| **Total profit** | **$1.45** |
| **% Return** | **20.71%** |

</div>

There were some interesting results, 2 of the games predicted correctly went against the bookies odds. This is a good sign, as it shows that the AI is not just predicting the favourite to win.

I don't know what to make of it yet. I'm not sure if I should be happy or sad. I think I'll just go to bed.

## Conclusions

A few important things to note, this is only a very small test, and was performed in a very short timeframe (I spent longer writing this post than I did in my IDE). Moreover, the results are not statistically significant, and I would need to run this test over more games to draw any meaningful conclusions. 

One week is not enough to retire yet to our AI overloads, but I will say through either good luck or good prompting, for once the AI has impressed me a little. I will continue to run and update this page with the results throughout the season.

PS. Here's a screenshot of the betting account if you'd like to see <a href="https://github.com/user-attachments/assets/aa3345d6-bcb9-40d0-a6e8-1badbb9ed65f" target="_blank">
proof</a> this was not run after the fact :)
