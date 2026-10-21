# Colors

The use of colors in current gameplay is a little messy and needs explanation. 

In the current implementation, it encodes two things:

1. The previous month’s harvest/cash pattern - for example, failed harvest, or financial pressure. Out of the 4 cards, attendance, harvest, cash and weather only harvest and cash interact. 
2. Whether the household received an intervention in the previous month.

Eg: 

- Amber: the previous month had failed harvest, or weak harvest together with a loan, and no intervention was made.
- Green: the same, but an intervention was made.
 
So a green good-harvest card means: “The harvest is good now, following that earlier pressure pattern and recent support.” It does not tell you whether there is a loan hidden in the
current month, but it does tell you to ignore harvest this month. 


The audience’s sheets use those same contexts. 

Eg: Someone holding green good harvest -> cash has a lookup associated with that observation (assume they already played the game in a similar map, and in that map, a similar intervention was given - that's what the color encodes). 

So the relationship is: 
```
Previous circumstances + previous support -> color
Color + currently revealed observation -> relevant historical examples -> suggested next check
```
So it's like color selects the historical group from which probabilities and suggestions are calculated.
For more details see the hh [game doc](https://github.com/bprashanth/gamesworkshop/blob/main/narrative/HOUSEHOLDS_GAME.md#colors-mean-context).
