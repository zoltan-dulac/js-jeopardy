#!/bin/sh

readCategories() {
  cat data-a11y.txt | grep -v "^Final Jeopardy" | grep -v "^Category" | awk -F"\t" '{print $1}' | uniq  | grep -v "^$" | sort -R | head -5
}

sortSheetRandomly() {
  cat data-a11y.txt | grep -v "^Final Jeopardy" | grep -v "^Category" | sort -R
}

getFinalJeopardy() {
  cat data-a11y.txt | grep "^Final Jeopardy" | sort -R | head -1
}


CATEGORIES=`readCategories`
DATA=`sortSheetRandomly`

for i in $CATEGORIES
do

  for j in 5 10 20 40
  do
    echo "$DATA" | grep "^$i\t$j" | head -1 | awk -F"\t" '{printf("%s\t%d\t%s\t%s\n", $1, $2, $3, $4)}'
  done
done

getFinalJeopardy
