import re
import requests
from bs4 import BeautifulSoup

url = "https://www.spriters-resource.com/snes/smarioworld/"
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

res = requests.get(url, headers=HEADERS)
soup = BeautifulSoup(res.text, 'html.parser')

element = soup.find('a', string=re.compile("Yoshi's Island 1"))
if element:
    print(f"Found Target: {element.text} | Href: {element['href']}")
    # Immediate parent
    p1 = element.parent
    print(f"Parent 1: {p1.name} | Class: {p1.get('class')}")
    p2 = p1.parent
    print(f"Parent 2: {p2.name} | Class: {p2.get('class')}")
    p3 = p2.parent
    print(f"Parent 3: {p3.name} | Class: {p3.get('class')}")
    p4 = p3.parent
    print(f"Parent 4: {p4.name} | Class: {p4.get('class')}")

for c, i in set(containers):
    print(f"Potential Container: Class={c}, ID={i}")

# Check for the header of these sections
header = soup.find('div', string=re.compile("World 1"))
if header:
    print(f"Found Header 'World 1': Class={header.get('class')}")
    next_div = header.find_next_sibling('div')
    if next_div:
        print(f"Next Div (potential sheet container) Class={next_div.get('class')}")
