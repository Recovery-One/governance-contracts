cat raw/* |grep "^0x"|sort|uniq -w 42 > addresses.csv
