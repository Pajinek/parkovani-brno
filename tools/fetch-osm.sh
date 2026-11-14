#!/bin/bash
cd "$(dirname "$0")/../data/raw"
B="49.140,16.505,49.280,16.710"
EPS=(https://overpass.openstreetmap.fr/api/interpreter https://overpass-api.de/api/interpreter)
q() {
  name=$1; query=$2
  for round in 1 2 3 4; do
    for u in "${EPS[@]}"; do
      curl -sS -m 150 -A "parkovani-brno-map/1.0 (personal project)" -H "Accept: application/json" --data-urlencode "data=$query" "$u" -o "$name.tmp" 2>/dev/null
      if head -c 200 "$name.tmp" | grep -q '"elements"\|"version"' && ! grep -q '"remark"' "$name.tmp"; then mv "$name.tmp" "$name.json"; echo "OK $name via $u $(stat -c%s $name.json)"; return; fi
      echo "fail $name $u"
    done
    sleep $((round*10))
  done
  echo "GIVEUP $name"
}
q roads "[out:json][timeout:80];way[highway~'^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|pedestrian|motorway_link|trunk_link|primary_link|secondary_link|tertiary_link)\$']($B);out geom tags;"
q water "[out:json][timeout:80];(way[natural=water]($B);relation[natural=water]($B);way[waterway~'^(river|canal)\$']($B););out geom tags;"
q rail "[out:json][timeout:80];way[railway=rail]($B);out geom tags;"
q green "[out:json][timeout:80];(way[leisure=park]($B);way[landuse~'^(forest|grass)\$']($B);way[natural=wood]($B);relation[landuse=forest]($B);relation[leisure=park]($B););out geom tags;"
q places "[out:json][timeout:60];node[place~'^(suburb|quarter)\$']($B);out body;"
echo DONE
