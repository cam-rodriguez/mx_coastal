// analyzing the development of mexico's coastal tourism powerhouses
// code by cam rodriguez

// goals:
// * Showcase the built environment in Mexican resort cities to highlight urbanization since 2000, using supervised classification 
// -- RandomForest, with 240 unique inputs to determine between built up/not built up land
// * Calculate area gain between decades, particularly 2000-2010-2020 
// -- (Time series)
// * With some ui features:
// -- panel on left side; map on right
// -- button drop-down between locations (based on geom)
// -- series of checkboxes to toggle between built-up land & the difference
// -- AND a restart button that will refresh the application!

// NOTE: in order to run this, you're going to need to have a Google Earth Engine account, as many of these variables are referential to assets within
// the GEE library. In order to better understand this, visit the code here: https://code.earthengine.google.com/83007ef4c6017b682263a5ab2a288f4e
// (You will need an account to run the code within Google Earth Engine.)
// Learn more about GEE here: https://developers.google.com/earth-engine/guides/computation_overview

// --------------------------------------- code starts ----------------------------------------
// Identifying image collection: Landsat 7, Collection 1 Tier 1 Real-time
var landsat = ee.ImageCollection("LANDSAT/LE07/C01/T1_RT")


// ----- Picking cities of focus -----
// cities: 
var cities_dict = {
  cancun: "Cancún",
  acapulco: "Acapulco", 
  vallarta: "Puerto Vallarta",
  cabo_jose: "San José del Cabo",
  cabo_lucas: "Cabo San Lucas",
  veracruz: "Veracruz",
  carmen: "Playa Del Carmen",
  cozumel: "Cozumel",
  tulum: "Tulum"};
print(cities_dict)
  
// ------ Figuring out bands?/ things for analysis -------
var l7_filtered = landsat.filterDate('2000-01-01','2022-01-01')
  .filterBounds(mexico) // filtering - for analysis

// // creating simple composite, clipped to mexico boundaries
var vizparams = {
  bands: ['B5', 'B4', 'B3'],
  min: 0,
  max: 0.5,
  gamma: [0.95, 1.1, 1]
} // setting parameters :)

// Map.addLayer(mexico,{},"MX boundaries")
// ^ here, the thought was to clip the composites to mexico's boundaries. unfortunately, the asset isn't exact to the coastline (maybe a CRS issue?)
// so it slices off some beaches and tourist zones, which is what i'm trying to look at. 


// ------ Creating classifier & composites to compare years -----
var l7_2020 = ee.Algorithms.Landsat.simpleComposite({
  collection: landsat.filterDate('2020-01-01','2020-12-31').filterBounds(mx),
});

Map.addLayer(l7_2020, {
  bands: ['B3','B2','B1'],
  min: 10,
  max: 120
}, 'landsat 7, 2020');

// -- params for classifier
// the geometry here is respectively 240 rectangles (120 built/120 not) between all nine cities, revised from the previous 60/60 that was spotty.
// still only used landsat 7 imagery, but this eliminated some patterns/gaps with the imagery!
var lc = notbuilt.merge(built); // merging the built up geom with the not built up geom
var bands = ['B1','B2','B3','B4','B5','B6_VCID_1','B6_VCID_2','B7','B8'];

// --- For reference: years of focus/year ranges
// var l7_2000 = l7_filtered.filterDate('2000-01-01','2000-12-31')
// var l7_2005 = l7_filtered.filterDate('2005-01-01','2005-12-31')
// var l7_2010 = l7_filtered.filterDate('2010-01-01','2010-12-31')
// var l7_2015 = l7_filtered.filterDate('2015-01-01','2015-12-31')
// var l7_2020 = l7_filtered.filterDate('2020-01-01','2020-12-31')
// var l7_2022 = l7_filtered.filterDate('2021-01-01','2022-01-31')

// -- Training classifier
var training = l7_2020.select(bands).sampleRegions({
  collection: lc,
  properties: ['class'],
  scale: 30
});

var classifier = ee.Classifier.smileRandomForest({
  numberOfTrees: 20})
  .train({
    features: training, // what we sampled
    classProperty: 'class', // what we want to predict
    inputProperties: bands // what the classifier will use to classify the geometry
  });
  
// ----- Applying to imagery ----
// but first: setting up color scheme
// :) https://coolors.co/89aae6-a8ba9d-c6ca53-d0ba63-d9aa72-e29a81-eb8a90-b359ae-7a28cb-00a896
// it's very lisa-frank-esque; was going for high contrast against the dark landsat imagery
var col2000 = ['#89AAE6']; // pale blue
var col2005 = ['#8ac926']; // bright green
var col2010 = ['#D9AA72']; // dusty orange
var col2015 = ['#FFBE0B']; // bright yellow
var col2020 = ['#EB8A90']; // "light coral" pink
var col2022 = ['#B359AE']; // "fuchsia crayon" pinkypurple
var col05diff = ['#5DEADC']; // vibrant cyan
var col10diff = ['#e9ff70']; // neon yellow
var col15diff = ['#FB5607']; // bright orange
var col20diff = ['#FF006E']; // bright pink
var col22diff = ['#8338EC']; // bright purple
// could this have been a dictionary? probably yes. is it? no

// --- ok... applying classifier to imagery ---
// * 2020
// applying to 2020 L7 image
var classified20 = l7_2020.select(bands).classify(classifier);
Map.addLayer(classified20.mask(classified20),
  {
    palette: col2020,
    opacity: 0.6,
  },
  'built-up, 2020',false);

// * 2015  
var l7_2015 = ee.Algorithms.Landsat.simpleComposite({
  collection: landsat.filterDate('2015-01-01','2015-12-31')
}); // creating 2015 composite

var classified15 = l7_2015.select(bands).classify(classifier);
Map.addLayer(classified15.mask(classified15),
  {
    palette: col2015,
    opacity: 0.6,
  },
  'built-up, 2015', false);

// * 2010
var l7_2010 = ee.Algorithms.Landsat.simpleComposite({
  collection: landsat.filterDate('2010-01-01','2010-12-31')
}); // creating 2010 composite

var classified10 = l7_2010.select(bands).classify(classifier);
Map.addLayer(classified10.mask(classified10),
  {
    palette: col2010,
    opacity: 0.6,
  },
  'built-up, 2010',false); // creating 2010 analysis
  
// * 2005
var l7_2005 = ee.Algorithms.Landsat.simpleComposite({
  collection: landsat.filterDate('2005-01-01','2005-12-31')
}); // creating 2005 composite

var classified05 = l7_2005.select(bands).classify(classifier);
Map.addLayer(classified05.mask(classified05),
  {
    palette: col2005,
    opacity: 0.6,
  },
  'built-up, 2005',false); // creating 2005 analysis

// * 2000
var l7_2000 = ee.Algorithms.Landsat.simpleComposite({
  collection: landsat.filterDate('2000-01-01','2000-12-31')
}); // creating 2000 composite

var classified00 = l7_2000.select(bands).classify(classifier);
Map.addLayer(classified00.mask(classified00),
  {
    palette: col2000,
    opacity: 0.6,
  },
  'built-up, 2000',false); // creating 2000 analysis

// * "2022" (2021 to 2022)
var l7_2021 = ee.Algorithms.Landsat.simpleComposite({
  collection: landsat.filterDate('2021-01-01','2022-1-31')
}); // creating 2021-22 composite

var classified21 = l7_2021.select(bands).classify(classifier);
Map.addLayer(classified21.mask(classified21),
  {
    palette: col2022,
    opacity: 0.6,
  },
  'built-up, 2021-22',false); // creating 2021-22 analysis 

  
// --- Calculting the difference ---  

var diff0500 = classified05.subtract(classified00);
Map.addLayer(diff0500.mask(diff0500),{
  palette: col05diff,
  opacity: 0.6
  },'diff 00-05', false
); // diff between 2000 and 2005

var diff1000 = classified10.subtract(classified00);
Map.addLayer(diff1000.mask(diff1000),{
  palette: col10diff,
  opacity: 0.6
  },'diff 00-10', false
); // calculating diff between 2000 and 2010

var diff1500 = classified15.subtract(classified00);
Map.addLayer(diff1500.mask(diff1500),{
  palette: col15diff,
  opacity: 0.6
  },'diff 00-15', false
); // diff between 2000 and 2015

var diff2100 = classified21.subtract(classified00);
Map.addLayer(diff2100.mask(diff2100),{
  palette: col22diff,
  opacity: 0.6
  },'diff 00-21', false
); // diff between 2000 and 2021

var diff2110 = classified21.subtract(classified10);
Map.addLayer(diff2110.mask(diff2110),{
  palette: col20diff,
  opacity: 0.6
  }, 'diff 10-21', false
); // diff between 2010 and 2021

// ----- Analysis for report ------ 
// Created a function breaking down the pixel area for a set year (via the classified image) and city
// Modified into a function from looking at the Quantifying Forest Change guide from GEE
// https://developers.google.com/earth-engine/tutorials/tutorial_forest_03

var areastats = function(classifiedimage, cityname){
  var area = classifiedimage.multiply(ee.Image.pixelArea())
  var stats = area.reduceRegion({
    reducer:ee.Reducer.sum(),
    geometry: cityname,
    scale: 30,
    maxPixels: 1e9
  });
  return print('pixels representing built-up land:', stats, 'square meters')
};

var areastatstest = areastats(classified00,cancun) // testing the function

var area00 = classified00.multiply(ee.Image.pixelArea());
var stats00 = area00.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: cancun,
  scale: 30,
  maxPixels: 1e9
});
print('pixels representing built-up land, 2000', stats00, 'square meters');
// confirming that it works above ^ 

// * calc area for cancun
print("Cancun")
var cancun_00 = areastats(classified00,cancun)
var cancun_05 = areastats(classified05,cancun)
var cancun_10 = areastats(classified10,cancun)
var cancun_15 = areastats(classified15,cancun)
var cancun_20 = areastats(classified20,cancun)
var cancun_22 = areastats(classified21,cancun)
var cancunarea = cancun.area(5,null)
print("Cancun study area:", cancunarea)

// * playa del carmen 
print("Playa Del Carmen")
var carmen_00 = areastats(classified00,carmen)
var carmen_05 = areastats(classified05,carmen)
var carmen_10 = areastats(classified10,carmen)
var carmen_15 = areastats(classified15,carmen)
var carmen_20 = areastats(classified20,carmen)
var carmen_22 = areastats(classified21,carmen)
var carmenarea = carmen.area(5,null)
print("Playa Del Carmen study area:", carmenarea)

// * tulum
print("Tulum")
var tulum_00 = areastats(classified00,tulum)
var tulum_05 = areastats(classified05,tulum)
var tulum_10 = areastats(classified10,tulum)
var tulum_15 = areastats(classified15,tulum)
var tulum_20 = areastats(classified20,tulum)
var tulum_22 = areastats(classified21,tulum)
var tulumarea = tulum.area(5,null)
print("Tulum study area:", tulumarea)

// * cozumel
print("Cozumel")
var cozumel_00 = areastats(classified00,cozumel)
var cozumel_05 = areastats(classified05,cozumel)
var cozumel_10 = areastats(classified10,cozumel)
var cozumel_15 = areastats(classified15,cozumel)
var cozumel_20 = areastats(classified20,cozumel)
var cozumel_22 = areastats(classified21,cozumel)
var cozumelarea = cozumel.area(5,null)
print("Cozumel study area:", cozumelarea)

// * san jose del cabo 
print("San Jose Del Cabo")
var cabo_jose_00 = areastats(classified00,cabo_jose)
var cabo_jose_05 = areastats(classified05,cabo_jose)
var cabo_jose_10 = areastats(classified10,cabo_jose)
var cabo_jose_15 = areastats(classified15,cabo_jose)
var cabo_jose_20 = areastats(classified20,cabo_jose)
var cabo_jose_22 = areastats(classified21,cabo_jose)
var cabo_josearea = cabo_jose.area(5,null)
print("San Jose Del Cabo study area: ", cabo_josearea)

// * cabo san lucas
print("Cabo San Lucas")
var cabo_lucas_00 = areastats(classified00,cabo_lucas)
var cabo_lucas_05 = areastats(classified05,cabo_lucas)
var cabo_lucas_10 = areastats(classified10,cabo_lucas)
var cabo_lucas_15 = areastats(classified15,cabo_lucas)
var cabo_lucas_20 = areastats(classified20,cabo_lucas)
var cabo_lucas_22 = areastats(classified21,cabo_lucas)
var cabo_lucasarea = cabo_lucas.area(5,null)
print("Cabo San Lucas study area: ", cabo_lucasarea)

// * acapulco 
print("Acapulco")
var acapulco_00 = areastats(classified00,acapulco)
var acapulco_05 = areastats(classified05,acapulco)
var acapulco_10 = areastats(classified10,acapulco)
var acapulco_15 = areastats(classified15,acapulco)
var acapulco_20 = areastats(classified20,acapulco)
var acapulco_22 = areastats(classified21,acapulco)
var acapulcoarea = acapulco.area(5,null)
print("Acapulco study area:", acapulcoarea)

// * puerto vallarta 
print("Puerto Vallarta")
var vallarta_00 = areastats(classified00,vallarta)
var vallarta_05 = areastats(classified05,vallarta)
var vallarta_10 = areastats(classified10,vallarta)
var vallarta_15 = areastats(classified15,vallarta)
var vallarta_20 = areastats(classified20,vallarta)
var vallarta_22 = areastats(classified21,vallarta)
var vallartaarea = vallarta.area(5,null)
print("Puerto Vallarta study area:", vallartaarea)

// * veracruz 
print("Veracruz")
var veracruz_00 = areastats(classified00,veracruz)
var veracruz_05 = areastats(classified05,veracruz)
var veracruz_10 = areastats(classified10,veracruz)
var veracruz_15 = areastats(classified15,veracruz)
var veracruz_20 = areastats(classified20,veracruz)
var veracruz_22 = areastats(classified21,veracruz)
var veracruzarea = veracruz.area(5,null)
print("Veracruz study area: ", veracruzarea)

// ----------------------------------------------------- //
//         ✧･ﾟ: *✧･ﾟ:*   UI    *:･ﾟ✧*:･ﾟ✧                 //
// ----------------------------------------------------- //

Map.setCenter(-86.8736, 20.9999,10) // setting map over Cancun/Yucatan

// ----- start button for places -----
// courtesy of: https://developers.google.com/earth-engine/guides/ui_widgets

var city_points ={
  "Cancún":[-86.8252,21.1553],
  "Acapulco": [-99.8342,16.8519],
  "Puerto Vallarta": [-105.2235,20.6547],
  "San José del Cabo": [-109.69726,23.05517],
  "Cabo San Lucas": [-109.9168,22.8868],
  "Veracruz": [-96.1272,19.1765],
  "Playa Del Carmen": [-87.0714,20.6336],
  "Cozumel": [-86.9317, 20.5013],
  "Tulum": [-87.4524,20.2066]}

var buttonparams = {
  width: '200px',
  height: '50px',
  fontWeight: 'bold',
  textAlign: 'center',
  position: 'top-right'
}

var city_select = ui.Select({
  style: buttonparams,
  items: Object.keys(city_points),
  onChange: function(key) {
    Map.setCenter(city_points[key][0], city_points[key][1]);
    Map.setZoom(13);
  }
});
city_select.setPlaceholder('✈️ Choose a destination...');

// -- end city select instructions --

// ----- creating ui panel -----

var panelparams = 
  {width: '500px',
  position: 'top-center',
  fontSize: '20px',
  backgroundColor: 'white',
  padding: '4px',
  }

// -- Formatting ui.Panel ----
// inspo taken from CSU's NREL chapter on GUI design
// https://ecodata.nrel.colostate.edu/gdpe-gee-remote-sensing-lessons/module10.html#widgets

var leftpanel = ui.Panel({style:panelparams})
  
ui.root.insert(0,leftpanel)
var hed = ui.Label('Trouble in paradise: breaking down urbanization in Mexican coastal cities 🌴',
  {fontWeight:'bold', fontSize: '30px', color: 'black'});
var dek = ui.Label("Using Landsat imagery and supervised classification to highlight urban development in 22 years of tourism in Mexico.",
  {fontWeight:'lighter', fontSize: '20px', color:'gray'});
var body = ui.Label(" Select between nine different resort cities to see the impact of tourism and economic development, and toggle between years to see the change.",
  {fontWeight: 'lighter', fontSize: '20px', color: 'gray'});
var button_instructions = ui.Label("Toggle between some of Mexico's tourism powerhouses below:",
  {fontSize: '14px', color: 'gray'})
  
var geo = ui.Label("GEO 442", {},"https://las.depaul.edu/academics/geography/Pages/default.aspx")
var repo = ui.Label("✶", {},"https://github.com/cam-rodriguez/")
var byline = ui.Label("✶ by cam rodriguez, for geo442.",
  {fontWeight:'lighter',fontSize:'12px', color:'gray'})

// --- create checkbox series (NOT CLICKBAIT!) -----
// This was originally going to be a button series, but the UI wasn't working. 
// Instead! A series of checkboxes to emulate the layers control panel, which will be hidden
// in the web app. The checkboxes vars are organized by year, then by category & same with the difference.
// For example: show 2000; show 2005, show diff 2000-2005; show 2010, show diff 2000-2010; ...

// -- creating checkboxes/add layer vars --
// * 2000 checkbox - show layer *
var check00params = {
  width: '200px',
  fontSize: '16px',
  color: col2000
}

var check00 = ui.Checkbox({
  label:'Built-up land in 2000', 
  value: false,
  style: check00params});

check00.onChange(function(checked){
  Map.layers().get(5).setShown(checked);
})

// * 2005 checkbox - show layer *
var check05params = {
  width: '200px',
  fontSize: '16px',
  color: col2005
}

var check05 = ui.Checkbox({
  label:'Built-up land in 2005', 
  value: false,
  style: check05params});

check05.onChange(function(checked){
  Map.layers().get(4).setShown(checked);
})

// leftpanel.add(check00).add(check05) // test to see how things are going so far

// * 2010 checkbox -- add layer *
var check10params = {
  width: '200px',
  fontSize: '16px',
  color: col2010
}

var check10 = ui.Checkbox({
  label:'Built-up land in 2010', 
  value: false,
  style: check10params});

check10.onChange(function(checked){
  Map.layers().get(3).setShown(checked);
})
// * 2015 checkbox -- add layer *
var check15params = {
  width: '200px',
  fontSize: '16px',
  color: col2015
}

var check15 = ui.Checkbox({
  label:'Built-up land in 2015', 
  value: false,
  style: check15params});

check15.onChange(function(checked){
  Map.layers().get(2).setShown(checked);
})
// * 2021/22 ("current") checkbox -- add layer *
var check22params = {
  width: '200px',
  fontSize: '16px',
  color: col2022
}

var check22 = ui.Checkbox({
  label:'Built-up land in 2021-22', 
  value: false,
  style: check22params});

check22.onChange(function(checked){
  Map.layers().get(6).setShown(checked);
})

// -- creating checkboxes/add diff vars --

// * 2000-2005 difference *
var diff05params = {
  width: '200px',
  fontSize: '16px',
  color: col05diff
}

var diff05 = ui.Checkbox({
  label:'2000-2005 difference', 
  value: false,
  style: diff05params});

diff05.onChange(function(checked){
  Map.layers().get(7).setShown(checked);
})

// * 2000-2010 difference *
var diff10params = {
  width: '200px',
  fontSize: '16px',
  color: '#C9EC00'
}

var diff10 = ui.Checkbox({
  label:'2000-2010 difference', 
  value: false,
  style: diff10params});

diff10.onChange(function(checked){
  Map.layers().get(8).setShown(checked);
})

// * 2000-2015 difference *
var diff15params = {
  width: '200px',
  fontSize: '16px',
  color: col15diff
}

var diff15 = ui.Checkbox({
  label:'2000-2015 difference', 
  value: false,
  style: diff15params});

diff15.onChange(function(checked){
  Map.layers().get(9).setShown(checked);
})

// * 2000-2022 difference * (ie, '2000 to present day')
var diff22params = {
  width: '200px',
  fontSize: '16px',
  color: col22diff
}

var diff22 = ui.Checkbox({
  label:'2000-present difference', 
  value: false,
  style: diff22params});

diff22.onChange(function(checked){
  Map.layers().get(10).setShown(checked);
})

// * 2010-2022 difference * (bonus!)
var diff1022params = {
  width: '200px',
  fontSize: '16px',
  color: col20diff
}

var diff1022 = ui.Checkbox({
  label:'2010-2022 difference', 
  value: false,
  style: diff1022params});

diff1022.onChange(function(checked){
  Map.layers().get(11).setShown(checked);
});
// ---- end checklist vars ------

// --- reset button ----
var reset = ui.Button({
  label: "Restart",
  onClick: function(){
    city_select.setValue(null,false)
    check00.setValue(false,true)
    check05.setValue(false,true)
    diff05.setValue(false,false)
    check10.setValue(false,false)
    diff10.setValue(false,false)
    check15.setValue(false,false)
    diff15.setValue(false,false)
    check22.setValue(false,false)
    diff22.setValue(false,false)
    Map.setCenter(-86.8736, 20.9999,10)
  }
}); // reset button -- n.b.: this started as a random thought and then a lot of trial and error and I can't believe it actually worked lmfao
// --- end reset button ---

// --- adding support for the GUI/panel & cleaning up GUI for app -----
// Inspired by, again, colorado NREL's approach, by nesting panels to have things side by side w/ 
// a horizontal flow. It seems to be the most straightforward way here!
// Section 5.7.1 is the most useful here to explain this section of code: 
// https://ecodata.nrel.colostate.edu/gdpe-gee-remote-sensing-lessons/module10.html#nested-functions

// var button = city_select!
leftpanel.add(hed).add(dek).add(body).add(button_instructions) // adding text
leftpanel.add(ui.Panel([city_select,reset],ui.Panel.Layout.flow('horizontal'))); // city select & restart button
leftpanel.add(check00); // start of checklist
leftpanel.add(ui.Panel([check05,diff05],ui.Panel.Layout.flow('horizontal'))); // nesting starts here?
leftpanel.add(ui.Panel([check10,diff10],ui.Panel.Layout.flow('horizontal')));
leftpanel.add(ui.Panel([check15,diff15],ui.Panel.Layout.flow('horizontal')));
leftpanel.add(ui.Panel([check22,diff22],ui.Panel.Layout.flow('horizontal')));
leftpanel.add(byline)

// modifying the map tools visibility to reduce visual clutter
Map.setControlVisibility(
  false, // all
  false, // layerlist
  true, // zoom
  true, // scale
  true, // maptypecontrol
  true, // fullscreen
  true ); // drawing

// ------------- end code ---------------- //

// in order to put this in a repo and make it available outside of gee: 
Export.table.toDrive({
  collection: lc,
  description:'Classification Geometry export',
  fileFormat: 'SHP'
}); // exporting classification geometry
