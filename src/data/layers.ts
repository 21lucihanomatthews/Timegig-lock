import { TileLayerConfig } from '../types/map';

export const MAP_LAYERS: TileLayerConfig[] = [
  {
    id: 'osm-standard',
    name: 'OpenStreetMap (Standard)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c'],
    thumbnail: 'https://tile.openstreetmap.org/4/8/5.png',
    category: 'terrain',
  },
  {
    id: 'carto-voyager',
    name: 'Voyager (Clean CARTO)',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c', 'd'],
    thumbnail: 'https://carto.com/help/images/building-maps/basemaps/voyager.png',
    category: 'streets',
  },
  {
    id: 'carto-dark',
    name: 'Dark Matter (HUD)',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c', 'd'],
    thumbnail: 'https://carto.com/help/images/building-maps/basemaps/dark_matter.png',
    category: 'dark',
  },
  {
    id: 'esri-satellite',
    name: 'Satellite View',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      '&copy; <a href="https://www.esri.com/" target="_blank">Esri</a>, Maxar, Earthstar Geographics, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
    maxZoom: 18,
    thumbnail: 'https://static.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/export?bbox=-10,40,10,55&size=200,120&f=image',
    category: 'satellite',
  },
  {
    id: 'carto-positron',
    name: 'Positron (Clean Light)',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c', 'd'],
    thumbnail: 'https://carto.com/help/images/building-maps/basemaps/positron.png',
    category: 'light',
  },
];
