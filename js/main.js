const debug = true;
const isFreshlyFetch = false;

const around = 30;
const centerX = 21.3078
const centerZ = -157.8589;

const node = `node(around:${around}, ${centerX}, ${centerZ});`
const way = `way(around:${around}, ${centerX}, ${centerZ});`;
const relation = `relation(around:${around}, ${centerX}, ${centerZ});`;
const storage = 'geoJSON'

const overpassURL = (param) => `https://overpass-api.de/api/interpreter?data=${param}`;

const print = (arg) => {
  if (debug) console.log(arg)
};

const getGeoJSON = async (url) => {
  if (debug) console.log()
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    return { error: error.message };
  }
}

const coordinatestoKM = (lat1, lon1, lat2, lon2) => {
  const earthRadius = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1); // deg2rad function converts degrees to radians
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = earthRadius * c; // Distance in km
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}


(async function () {

  const query = `[out:json];(${way});out ids;`
  let geoJSON;
  if (!localStorage.getItem(storage) || isFreshlyFetch) {
    const response = await getGeoJSON(overpassURL(query));
    if (response.error) {
      print(response.error);
    } else {
      localStorage.setItem(storage, JSON.stringify(response));
      geoJSON = response;
      print('freshly fetch geoJSON');
    }
  } else {
    geoJSON = JSON.parse(localStorage.getItem(storage));
    print('retrieved geoJSON from localstorage');
  }

  const scene = document.querySelector('a-scene');

  const width = 5;
  const height = 5;

  geoJSON.elements.forEach(async (item, index) => {
    console.log(item)
    const { type, id } = item;
    const { elements } = await getGeoJSON(overpassURL(`[out:json];way(${id});out body;>;out skel qt;`));
    const nodeIds = elements.find(item => item.type = 'way')?.nodes;
    const coordinates = nodeIds.map(nodeId => {
      const find = elements.find(item => item.type === 'node' && item.id === nodeId);
      return [find.lat, find.lon];
    });
    const polygon = turf.polygon([coordinates]);
    const centroid = turf.centroid(polygon).geometry.coordinates;
    const [centroidX, centroidZ] = centroid;
    const xPost = coordinatestoKM(centroidX, 0, centerX, centerZ);
    const zPost = coordinatestoKM(0, centroidZ, centerX, centerZ);
    const building = document.createElement('a-box');
    const position = { x: xPost, y: 0, z: zPost };
    console.log(position);
    building.setAttribute('position', position);
    building.setAttribute('width', width);
    building.setAttribute('height', height);
    building.setAttribute("depth", 2);
    building.setAttribute('color', (() => index % 2 == 0 ? 'orange' : 'green')())

    scene.appendChild(building);
  });
})();
