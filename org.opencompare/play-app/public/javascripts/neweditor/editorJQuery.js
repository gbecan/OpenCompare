//********************************************************************************************************************************************************************
//Some function

/**
 * return a string representation of the value of the given cell
 * @param {Cell} cell - The cell
 * @return {string} a string representation of cell.value
 */
function valueToString (cell) {
  var string = ''

  if (cell.type === 'multiple') {
    for (var i in cell.value) {
      if (i > 0) string += ', '
      string += cell.value[i]
    }
  } else if (cell.type !== 'undefined') {
    string = '' + cell.value
  }

  return string
}

/**
 * return a html representation of the value of the given cell
 * @param {Cell} cell - The cell
 * @return {string} a html representation of cell.value
 */
function valueToHtml (cell) {
  var html = ''

  if (cell.type === 'multiple') {
    for (var i in cell.value) {
      if (i > 0) html += ', '
      html += cell.value[i]
    }
  } else if (cell.type === 'image') {
    html = '<a target="_blank" href="' + cell.value + '"><img class="cell-img" src="' + cell.value + '"></a>'
  } else if (cell.type === 'url') {
    html = '<a target="_blank" href="' + cell.value + '">' + cell.value + '</a>'
  } else if (cell.type !== 'undefined') {
    html = '' + cell.value
  }

  return html
}


/**
 * Return if obj is of type number (integer/real)
 * @param {Product|Feature|Cell|Filter} obj - the object that we want to know if it's of type number
 * @return {boolean} - if obj is of type number
 */
function isNumber (obj) {
  return obj.type === 'integer' || obj.type === 'real'
}

/**
 * Return the class of the column for the specified feature
 * @param {Feature} feature - feature
 * @return {string} - the class
 */
function columnClass (feature) {
  return isNumber(feature)
    ? 'number'
    : 'other'
}

//********************************************************************************************************************************************************************
//Editor

/**
 * The Editor class
 * @param {string} divID - The id attribute of the tag that will contain the editor.
 * @param {string} pcmID - The id of the PCM to load from the API.
 */
function Editor (divID, pcmID) {
  var that = this
  var self = this
  this.api = '/api/getnewjson/'
  this.div = $('#' + divID).addClass('editor')
  this.pcmID = pcmID
  this.pcm = false

  this.views = {}
  this._view = null

  //Create loading div
  this.loadingDiv = $('<div>').addClass('loadingDiv').html('<svg class="loader" width="32" height="32"><circle class="path" cx="16" cy="16" r="12" fill="none" stroke-width="2" stroke-miterlimit="10"/></svg>').appendTo(this.div)
  this.loadingMessage = $('<div>').addClass('loadingMessage').html('loading').appendTo(this.loadingDiv)

  //Create header
  this.headerShow = true
  this.header = $("<div>").addClass("editor-header").appendTo(this.div)
  this.name = $("<div>").addClass("pcm-name").html("No pcm loaded").appendTo(this.header)
  this.licenseDiv = $("<div>").addClass("pcm-param").html("<b>License : </b>").appendTo(this.header)
  this.license = $("<span>").appendTo(this.licenseDiv)
  this.sourceDiv = $("<div>").addClass("pcm-param").html("<b>Source : </b>").appendTo(this.header)
  this.source = $("<span>").appendTo(this.sourceDiv)

  //Create action bar
  this.actionBar = $("<div>").addClass("editor-action-bar").appendTo(this.div)
  this.showConfiguratorButton = $("<div>").addClass("button").click(function () {
    self.showConfigurator()
  }).appendTo(this.actionBar)
  this.configuratorArrow = $("<div>").addClass("configurator-arrow").appendTo(this.showConfiguratorButton)
  this.showConfiguratorButton.append(" ")
  this.showConfiguratorButtonMessage = $("<span>").html("Hide configurator").appendTo(this.showConfiguratorButton)

  this.actionBar.append('<div class="separator"></div>')

  this.showButton = {}

  this.showButton.pcm = $('<div>').addClass('button').html('<i class="material-icons">reorder</i> PCM').click(function () {
    self.showView('pcm')
  }).appendTo(this.actionBar)

  this.showButton.chart = $('<div>').addClass('button').html('<i class="material-icons">show_chart</i> Chart').click(function () {
    self.showView('chart')
  }).appendTo(this.actionBar)

  this.showButton.map = $('<div>').addClass('button').html('<i class="material-icons">map</i> Map').click(function () {
    self.showView('map')
  }).appendTo(this.actionBar)

  this.actionBar.append('<div class="separator"></div>')

  this.exportButton = $('<a>').addClass('button').html('<i class="material-icons">file_download</i>  Download').attr('href', this.api + this.pcmID).attr('download', this.pcmID + '.json').appendTo(this.actionBar)

  this.retypeButton = $('<div>').addClass('button').html('<i class="material-icons">refresh</i> Retype').click(function () {
    self.retype()
  }).appendTo(this.actionBar)

  //Action bar right pane
  this.actionBarRightPane = $("<div>").addClass("editor-action-bar-right-pane").appendTo(this.actionBar)
  this.showHeaderButton = $("<div>").addClass("button").click(function () {
    self.showHeader()
  }).html('<i class="material-icons">keyboard_arrow_up</i>').appendTo(this.actionBarRightPane)

  //Create content
  this.content = $("<div>").addClass("editor-content").appendTo(this.div)

  //Create configurator
  this.configuratorShow = true
  this.configurator = $("<div>").addClass("configurator").appendTo(this.content)

  //Create content wrap
  this.contentWrap = $("<div>").addClass("content-wrap").appendTo(this.content)

  //Create pcm
  this.views.pcm = $('<div>').addClass('pcm-wrap').appendTo(this.contentWrap)

  //Create cell edition
  this.cellEdit = null
  this.cellEditDiv = $('<div>').addClass('cell-edit').appendTo(this.views.pcm)
  this.cellEditType = $('<div>').addClass('cell-edit-type').appendTo(this.cellEditDiv)
  this.cellEditContent = $('<div>').addClass('cell-edit-content').appendTo(this.cellEditDiv)
  this.pcmTable = $("<div>").addClass('pcm-table').appendTo(this.views.pcm)

  //Create chart
  this.views.chart = $("<div>").appendTo(this.contentWrap)
  this.chartFactory = new ChartFactory(this, this.views.chart)

  //create map
  this.views.map = $("<div>").appendTo(this.contentWrap)

  //Display view
  var view = window.location.href.match(/[^\?]+$/g)[0]
  if (typeof this.views[view] === 'undefined') view = 'pcm'
  this.showView(view)

  //Finally load the pcm view
  this.loadPCM()
}

Object.defineProperty(Editor.prototype, 'checkInterpretation', {
  get: function(){
    var n = 0
    var max = 0
    for(var p in this.products){
      for(var c in this.products[p].cells.array){
        max++
        if(this.products[p].cells.array[c].interpretation != null){
          n++
        }
      }
    }
    return 'interpretation : ' + n + '/' + max + ' ' + ((n == max) ? 'OK' : 'incomplete')
  }
})

/**
 * Show/Hide the loading div
 * @param {boolean} loading - true to showloading div, false to hide
 * @param {string} message - the loading message to display
 */
Editor.prototype.loading = function (loading = true, message = 'loading') {
  if (loading) {
    this.loadingMessage.html(message)
    this.loadingDiv.addClass('visible')
  } else {
    this.loadingDiv.removeClass('visible')
  }
}

/**
 * Show the cell edit div
 * @param {Cell} cell - the cell to edit.=
 */
Editor.prototype.setCellEdit = function (cell) {
  if (this.cellEdit != null) this.cellEdit.div.removeClass('selected')
  this.cellEdit = cell
  this.cellEdit.div.addClass('selected')
  this.views.pcm.addClass('cell-edit-visible')
  var type = this.cellEdit.type
  this.cellEditType.html(type)
  this.cellEditContent.html(valueToString(this.cellEdit))
}

/**
 * Show a view
 * @param {undefined|string} view - the view or the name of the view to show, if undefined show the pcm view
 */
Editor.prototype.showView = function (view) {
  if (typeof view === 'undefined') {
    view = 'pcm'
  }

  if (this._view !== view) {
    if (this._view != null) {
      this.views[this._view].hide()
      this.showButton[this._view].removeClass('active')
    }

    this._view = view
    this.views[this._view].show()
    this.showButton[this._view].addClass('active')

    if (view === 'map'){
      this.initMap()
    }
  }
}

/**
 * Return the feature wuth the specified name
 * @param {string} name - the name of the desired feature
 * @return {Feature} - the desired feature, or false if not found
 */
Editor.prototype.getFeatureByName = function (name) {
  var feature = false
  for (var f in this.pcm.features) {
    if (this.pcm.features[f].name == name) {
      feature = this.pcm.features[f]
      break
    }
  }
  return feature
}

/**
 * Load the pcm from the API
 * @param {string} pcmID - The id of the pcm to load, if undefined load the pcm with the current id (editor.pcmID)
 */
Editor.prototype.loadPCM = function (pcmID) {
  pcmID = typeof pcmID === 'undefined'
    ? false
    : pcmID
  var that = this //deprecated use self instead
  var self = this
  if (pcmID) this.pcmID = pcmID

  this.loading(true, 'loading pcm from api')

  $.get(this.api + this.pcmID, function (data) {
    console.log(data)
    self.pcm = data
    self.pcm.productsSorted = []

    //Add some attributes and functions to products
    for (var p in self.pcm.products) {
      var product = self.pcm.products[p]
      self.pcm.productsSorted.push(product)
      product.visible = true
      product.dataset = null
      product.cellsByFeature = {}

      // Add some attributes and functions to cells
      for (var c in product.cells) {
        var cell = product.cells[c]
        product.cellsByFeature[cell.featureID] = cell
        cell.match = true

        // The div used to display the cell
        cell.div = $('<div>').addClass('pcm-cell').html(valueToHtml(cell)).click({cell: cell}, function (event) {
          self.setCellEdit(event.data.cell)
        })
        cell.div.cell = cell
      }

      /**
       * Return the cell for the specified feature
       * @param {undefined|number|Feature} feature - If undefined return cell for feature at index 0 in editor.features, or at the specified index is feature is a number.
       * @return {Cell} The cell corresponding to the feature.
       */
      product.getCell = function (feature) {
        if (typeof feature === 'undefined') {
          feature = self.pcm.features[self.pcm.primaryFeatureID]
        } else if (typeof feature === 'string') {
          feature = self.pcm.features[feature]
        }

        var cell = this.cellsByFeature[feature.id]
        if (typeof cell === 'undefined') {
          cell = false
        }
        return cell
      }

      /**
       * Return if the product match the configurator
       * The product match the configurator if every cell of the product got his match attribute equals to true
       * @return {boolean} the product match the configurator
       */
      product.match = function () {
        var match = true
        for (var c in this.cells) {
          if (this.cells[c].match === false) {
            match = false
            break
          }
        }
        return match
      }

      /**
       * Hide/show the product
       * Used to hide products that doesn't match configurator
       * @param {boolean} visible - true to show, false to hide
       */
      product.setVisible = function (visible) {
        this.visible = visible
        for (var c in this.cells) {
          if (visible) {
            this.cells[c].div.removeClass('hidden')
          } else {
            this.cells[c].div.addClass('hidden')
          }
        }
        if (this.dataset != null) {
          this.dataset.hidden = !this.visible
        }
      }

      /**
       * Return a dataset
       * Used in chartFactory for chartjs
       * @param {Feature|string} n - the feature or the feature id corresponding to the cell we want to use as label
       * @param {Feature|string} x - the feature or the feature id corresponding to the cell we want to use as 1st dimension
       * @param {Feature|string} y - ... 2nd dimension
       * @param {Feature|string|null} r - ... 3rd dimension (optional)
       * @param {Feature|string|null} c - ... 4th dimension (optional)
       * @return {Object} a dataset matching chartjs format
       */
      product.newDataset = function (n, x, y, r, c) {
        var self = this;
        this.dataset = {
           label: self.getCell(n).value,
           hidden: !self.visible,
           data: [{
             x: self.getCell(x).value,
             y: self.getCell(y).value,
             r: r
                ? self.getCell(r).value
                : 0,
             c: c
                ? self.getCell(c).value
                : 0
           }]
        }
        return this.dataset
      }
    }

    // add a filter to all features
    for (var f in self.pcm.features) {
      var feature = self.pcm.features[f]
      feature.filter = new Filter(feature, self)
    }

    // The callback when the pcm is loaded
    self.pcmLoaded()
  })
}

/**
 * The callback when the pcm is loaded
 * It updates the UI et call some init methods
 * Don't init map here, it will cause a bug because the div that is supposed to contain the map is hidden !!!
 */
Editor.prototype.pcmLoaded = function () {
  this.loading(false)

  //Name
  var name = this.pcm.name
  if (typeof name === 'undefined' || name.length === 0) {
    name = 'No name'
  }
  this.name.html(name)

  //License
  var license = this.pcm.license
  if (typeof license === 'undefined' || license.length === 0) {
    license = 'unknown'
  }
  this.license.html(license)

  //Source
  var source = this.pcm.source
  if (source.length === 0) {
    source = 'unknown'
  } else {
    source = "<a href='" + source + "' target='_blank'>" + source + "</a>"
  }
  this.source.html(source)

  //Init configurator
  this.initConfigurator()

  //Sort products on first feature (display inside by calling Editor.initPCM())
  this.pcm.features[this.pcm.primaryFeatureID].filter.setSorting(ASCENDING_SORTING)

  //init the chart
  this.initChart()
}

/**
 * Update the pcm in the view
 */
Editor.prototype.initPCM = function () {
  // Init view (detach every element)
  this.pcmTable.find(".pcm-column-header").detach()
  this.pcmTable.find(".pcm-cell").detach()

  // Append the primary feature to the view
  this.addFeatureToView(this.pcm.primaryFeatureID)

  // Append every other features to the view
  for (var f in this.pcm.features) {
    if (f !== this.pcm.primaryFeatureID) {
      this.addFeatureToView(f)
    }
  }
}

/**
 * Append the feature to the view (into pcmTable)
 * @param {string} id - The id of the feature to append to the view
 */
Editor.prototype.addFeatureToView = function (id) {
  var col = $("<div>").addClass("pcm-column").addClass(columnClass(this.pcm.features[id])).appendTo(this.pcmTable)
  col.append(this.pcm.features[id].filter.columnHeader)
  for (var p in this.pcm.productsSorted) {
    col.append(this.pcm.productsSorted[p].getCell(this.pcm.features[id]).div)
  }
}

/**
 * init the chartFactory
 */
Editor.prototype.initChart = function () {
  this.chartFactory.init()
}

/**
 * create (if needed) and init mapFactory
 */
Editor.prototype.initMap = function () {
  if (typeof this.mapFactory === 'undefined') {
    this.mapFactory = new MapFactory(this, this.views.map)
    this.mapFactory.init()
  }
}

/**
 * Append every filter div to the configurator
 */
Editor.prototype.initConfigurator = function () {
  this.configurator.empty()

  for (var f in this.pcm.features) {
    if (f == this.pcm.primaryFeatureID) {
      this.configurator.prepend(this.pcm.features[f].filter.div)
    } else {
      this.configurator.append(this.pcm.features[f].filter.div)
    }
  }
}

/**
 * Hide or show the configurator
 */
Editor.prototype.showConfigurator = function () {
  this.configuratorShow = !this.configuratorShow;

  if(this.configuratorShow){
    this.configurator.removeClass("hidden");
    this.contentWrap.removeClass("full-width");
    this.configuratorArrow.removeClass("right");
    this.showConfiguratorButtonMessage.html("Hide configurator");
  }else{
    this.configurator.addClass("hidden");
    this.contentWrap.addClass("full-width");
    this.configuratorArrow.addClass("right");
    this.showConfiguratorButtonMessage.html("Show configurator");
  }
}

/**
 * Hide or show the header
 */
Editor.prototype.showHeader = function () {
  this.headerShow = !this.headerShow;

  if(this.headerShow){
    this.header.removeClass("hidden");
    this.content.removeClass("full-height");
    this.showHeaderButton.html('<i class="material-icons">keyboard_arrow_up</i>');
  }else{
    this.header.addClass("hidden");
    this.content.addClass("full-height");
    this.showHeaderButton.html('<i class="material-icons">keyboard_arrow_down</i>');
  }
}

/**
 * Retype the pcm
 */
Editor.prototype.retype = function () {
 var self = this

  this.loading(true, 'retype the pcm')

  $.get('/admin/retype/' + this.pcmID, function (data) {
    self.loading(false)
    location.reload()
  })
}

/**
 * Called when a filter changed to update views
 * @param {Filter} filter - The filter which changed
 */
Editor.prototype.filterChanged = function (filter) {
  //console.log("Filter changed for feature : " + filter.feature.name);
  for (var p in this.pcm.products) {
    var product = this.pcm.products[p] // get the product
    // chech if the product match all filters (product.match() is not evaluated if filter.match(product.getCell(filter.feature))==false, it's better for perf)
    product.setVisible(filter.match(product.getCell(filter.feature)) && product.match())
  }

  //Update chart
  this.chartFactory.update()
  this.mapFactory.update()
}

/**
 * Sort products on the specified feature using a quicksort
 * @param {undefined|Feature} feature - the ferature, if undefined use the primary feature
 */
Editor.prototype.sortProducts = function (feature = false) {
  if (!feature) {
    feature = this.pcm.features[this.pcm.primaryFeatureID]
  }

  //Sort products using quicksort
  //console.time("quicksortProducts");
  this.quicksortProducts(feature)
  //console.timeEnd("quicksortProducts");

  //Update pcm
  //console.time("initPCM");
  this.initPCM()
  //console.timeEnd("initPCM");
}

/**
 * Perform a quicksort on products on the specified feature
 * @param {Feature} feature - The feature used for the quicksort
 */
Editor.prototype.quicksortProducts = function (feature) {
  var stack = []
  stack.push(0)
  stack.push(this.pcm.productsSorted.length - 1)
  while (stack.length > 0) {
    var h = stack.pop()
    var l = stack.pop()
    var p = this.partitionProducts(l, h, feature)

    if (p - 1 > l) {
      stack.push(l)
      stack.push(p - 1)
    }

    if (p + 1 < h) {
      stack.push(p + 1)
      stack.push(h)
    }
  }
}

/**
 * Partition products between l and h using feature
 * @param {number} l - the lower limit
 * @param {number} h - the upper limit
 * @param {Feature} feature - the feature used to sort products
 * @return {number} - the pivot for the quicksort
 */
Editor.prototype.partitionProducts = function (l, h, feature) {
  var pivot = this.pcm.productsSorted[h]
  var i = l
  for (var j = l; j < h; j++) {
    if (feature.filter.compare(this.pcm.productsSorted[j], pivot) <= 0) {
      var temp = this.pcm.productsSorted[i]
      this.pcm.productsSorted[i] = this.pcm.productsSorted[j]
      this.pcm.productsSorted[j] = temp
      i++
    }
  }
  var temp = this.pcm.productsSorted[i];
  this.pcm.productsSorted[i] = this.pcm.productsSorted[h]
  this.pcm.productsSorted[h] = temp
  return i
}

//********************************************************************************************************************************************************************
//Filter
var NO_SORTING = 1;
var ASCENDING_SORTING = 2;
var DESCENDING_SORTING = 3;

/**
 * Filter object used to filter products on a feature.
 * @param {Feature} feature - The feature for the filter.
 * @param {Editor} editor - The editor.
 */
function Filter(feature, editor){
  var that = this;
  this.feature = feature
  this.editor = editor
  this.values = [] //Contains all different values for this feature
  this.occurrences = {} // key is a value from values and value is the number of occurrences (this.occurrences['toto'] = number of occurrences of toto)
  this.hasCheckbox = false //Set at true is checkbox are used
  this.checkboxs = {} //For each value associate a checkbox that say if the value match the filter
  this.operator = 'and' //Operator for multiple value matching (and/or)
  this.min = false //Minimum value in all values
  this.max = false //Maximum value in all values
  this.lower = false //Minimum value which match filter
  this.upper = false //Maximum value which match filter
  this.step = 1 //Step for the slider when feature is a numeric value
  this.search = '' //Will contain a regexp entered by the user in a search form
  this.sorting = NO_SORTING

  // Extract all different values
  for (var p in this.editor.pcm.products) {
    var cell = this.editor.pcm.products[p].getCell(feature)
    if (this.type === 'multiple') {
      for (var i in cell.value) {
        var value = cell.value[i]
        if ($.inArray(value, this.values) === -1) {
          this.values.push(value)
          this.occurrences[value] = 1
        } else {
          this.occurrences[value]++
        }
      }
    } else {
      if ($.inArray(cell.value, this.values) === -1) {
        this.values.push(cell.value)
        this.occurrences[cell.value] = 1

        if (feature.type === 'integer' || feature.type === 'real') {
          if (!this.min && !this.max) {
            this.min = cell.value
            this.max = cell.value
          } else if (cell.value < this.min) {
            this.min = cell.value
          } else if (cell.value > this.max) {
            this.max = cell.value
          }
        }
      } else {
        this.occurrences[cell.value]++
      }
    }
  }

  this.lower = this.min
  this.upper = this.max
  if (feature.type === 'integer') { //Integer
    this.step = 1
  } else if (feature.type === 'real') { //Real
    this.step = 0.1
  } else {
    //Sort values on number of occurrences
    this.values.sort(function (v1, v2) {
      if (that.occurrences[v1] <= that.occurrences[v2]) {
        return 1
      } else if (that.occurrences[v1] >= that.occurrences[v2]) {
        return -1
      } else {
        return v1.toLowerCase().localeCompare(v2.toLowerCase)
      }
    })

    //Create checkboxs only if there are les than 20 differents values or it's a multiple value
    if (this.type === 'multiple' || this.values.length <= 20) {
      this.hasCheckbox = true;
      for (var v in this.values) {
        var value = this.values[v]
        this.checkboxs[value] = new Checkbox(value + ' (' + this.occurrences[value] + ')' , function () {
          that.editor.filterChanged(that)
        })
      }
    }
  }

  //Create div for column header
  this.columnHeader = $("<div>").addClass("pcm-column-header").click(function (event) {
    that.swapSorting()
    event.stopImmediatePropagation()
  }).html(this.feature.name)

  //Create div for configurator
  this.show = false;
  this.div = $("<div>").addClass("feature");

  this.button = $("<div>").addClass("feature-button").click(function(){
    that.toggleShow();
  }).appendTo(this.div);
  this.arrow = $("<div>").addClass("feature-arrow").appendTo(this.button);
  this.button.append(" " + this.feature.name);

  this.contentWrap = $("<div>").addClass("feature-content-wrap").css("height", 0).appendTo(this.div);

  this.content = $("<div>").addClass("feature-content").appendTo(this.contentWrap);

  if (this.values.length == 1 || (this.type == "integer" || this.type == "real") && this.min == this.max) { //If there is only one value
    this.content.append(this.values[0])
    //console.log(this.feature.name + ' ' + this.type + ' min=' + this.min + ' max=' + this.max)
  } else if (this.type == "integer" || this.type == "real") { //If type is a number
    //Create the slider
    this.slider = new Slider(this.min, this.max, this.lower, this.upper, this.step, function (slider) {
      that.lower = slider.lower;
      that.upper = slider.upper;
      //console.log(that.feature.name + ' lower=' + that.lower + ' upper=' + that.upper)
      that.editor.filterChanged(that)
    });

    //Add the slider
    this.content.append(this.slider.div);
  } else {
    //Create and add the search input
    if (this.type === 'multiple') {
      this.operatorSelect = $('<select>').html(
        '<option value="and">AND</option>' +
        '<option value="or">OR</option>'
      ).change(function () {
        that.operator = that.operatorSelect.val()
        that.editor.filterChanged(that)
      }).appendTo(this.content)
    } else {
      this.searchInput = $("<input>").addClass("search-input").attr("placeholder", "Search").keyup(function () {
        if (that.searchInput.val() != that.search) {
          that.search = that.searchInput.val();
          that.editor.filterChanged(that);
        }
      }).appendTo(this.content)
    }

    if(this.hasCheckbox){
      this.buttonSelectUnselectAll = $("<div>").addClass("button").click(function(){
        that.selectUnselectAll();
      }).html("Select/Unselect all").appendTo(this.content);

      //Add all checkbox
      for(var c in this.checkboxs){
        this.content.append(this.checkboxs[c].div);
      }
    }
  }
}

Object.defineProperty(Filter.prototype, 'type', {
  get: function() {
    return this.feature.type;
  }
})

//Check if all value are matched
Filter.prototype.matchAll = function(){
  var res = true;
  if(this.type === "integer" || this.type === "real"){
    res = (this.lower <= this.min && this.upper >= this.max)
  } else if (this.search.length > 0) {
    res = false;
  } else if (this.hasCheckbox) {
    for (var c in this.checkboxs) {
      if (this.checkboxs[c].notChecked()) {
        res = false
        break
      }
    }
  }
  return res
}

//Check if the cell match this filter
Filter.prototype.match = function (cell) {
  var match = this.matchAll()

  if (!match) {
    if (this.type === 'integer' || this.type === 'real') {
      //console.log('value=' + cell.value + ' lower=' + this.lower + ' upper=' + this.upper)
      match = cell.value >= this.lower && cell.value <= this.upper
    } else if (this.type === 'multiple') { // if there is at least one value that match filter the cell match
      if (this.operator === 'or') {
        for (var i in cell.value) {
          if ((match = this.checkboxs[cell.value[i]].isChecked())) break
        }
      } else if (this.operator === 'and') {
        for (var value in this.checkboxs) {
          if (this.checkboxs[value].isChecked()) {
            var present = false
            for (var i in cell.value) {
              if (cell.value[i] == value) {
                present = true
                break
              }
            }
            if (!(match = present)) break
          }
        }
      } else {
        console.error('unknown operator ' + this.operator)
      }
    } else {
      if (this.search.length > 0) { //If there is a search regexp we use it and not the checkboxs
        var regexp = new RegExp(this.search, 'i'); //Create a regexp with this.search that isn't case-sensitive
        match = ('' + cell.value).match(regexp) != null;
      } else { //Else we use checkboxs
        if (typeof this.checkboxs[cell.value] !== "undefined") {
          match = this.checkboxs[cell.value].isChecked();
        }
      }
    }
  }

  cell.match = match; //Set the cell.match attribute, it's used to check if all cell match them respective filter
  return cell.match;
}

//Select/Unselect all checkboxs
Filter.prototype.selectUnselectAll = function(){
  this.search = "";

  var select = true;

  for(var c in this.checkboxs){
    if(this.checkboxs[c].notChecked()){
      select = false;
      break;
    }
  }

  for(var c in this.checkboxs){
    this.checkboxs[c].setChecked(!select, false);
  }

  this.editor.filterChanged(this);
}

/**
 * Scroll to the column's feature in pcm view
 */
Filter.prototype.scrollTo = function () {
  var left = this.editor.pcmTable.scrollLeft() + this.columnHeader.parent().position().left
  this.editor.pcmTable.animate({scrollLeft: left}, 200)
}

//Hide/Show the filter form (checkboxs, input, slider, ...)
Filter.prototype.toggleShow = function(){
  this.show = !this.show;
  if (this.show) {
    this.contentWrap.css("height", this.content.outerHeight()+"px")
    this.arrow.addClass("bottom")
    this.scrollTo()
  } else {
    this.contentWrap.css("height", 0)
    this.arrow.removeClass("bottom")
  }
}

//Change sorting
Filter.prototype.swapSorting = function(){
  //console.log("Swap sorting for feature : "+this.feature.name);
  if (this.sorting === ASCENDING_SORTING) {
    this.setSorting(DESCENDING_SORTING);
  } else {
    this.setSorting(ASCENDING_SORTING);
  }
}

Filter.prototype.setSorting = function(sorting, autoSort=true, resetOther=true){
  //Reset all other filter
  if (resetOther) {
    for (var f in this.editor.pcm.features) {
      this.editor.pcm.features[f].filter.setSorting(NO_SORTING, false, false);
    }
  }

  //remove old class
  if (this.sorting === ASCENDING_SORTING) {
    this.columnHeader.removeClass("ascending");
  } else if (this.sorting === DESCENDING_SORTING) {
    this.columnHeader.removeClass("descending");
  }

  //set new value
  this.sorting = sorting;

  //add new class
  if (this.sorting === ASCENDING_SORTING) {
    this.columnHeader.addClass("ascending");
  } else if (this.sorting === DESCENDING_SORTING) {
    this.columnHeader.addClass("descending");
  }

  //sort
  if (autoSort) {
    this.editor.sortProducts(this.feature);
  }
}

//Compare
Filter.prototype.compare = function(p1, p2){
  var res = 0;
  if(this.sorting === NO_SORTING){
    console.log("Try to compare 2 product using a filter without sorting direction");
  }else{
    var val1 = p1.getCell(this.feature).value
    var val2 = p2.getCell(this.feature).value
    if (val1 > val2) {
      res = 1;
    } else if (val1 < val2) {
      res = -1;
    }
  }

  if (this.sorting === DESCENDING_SORTING) {
    res = res * -1;
  }

  return res;
}


//********************************************************************************************************************************************************************
//Checkbox
function Checkbox(name, onChange=false, checked=true){
  var that = this;
  this.onChange = onChange;
  this.div = $("<div>").addClass("checkbox");
  this.checkbox = $("<input type='checkbox'>").prop('checked', checked).change(function(){
    that.triggerOnChange()
  }).appendTo(this.div);
  this.name = name;
  this.label = $("<label>").addClass("checkbox-label").html(this.name).click(function(){
    that.setChecked();
  }).appendTo(this.div);
}

Checkbox.prototype.setChecked = function(checked, trigger=true){
  if(typeof checked == "undefined"){
    checked = !this.isChecked();
  }
  this.checkbox.prop('checked', checked);

  if(trigger){
    this.triggerOnChange();
  }
}

Checkbox.prototype.isChecked = function(){
  return this.checkbox.is(":checked");
}

Checkbox.prototype.notChecked = function(){
  return !this.isChecked();
}

Checkbox.prototype.triggerOnChange = function(){
  if(this.onChange){
    this.onChange(this);
  }
}

//********************************************************************************************************************************************************************
//Slider
function Slider(min, max, lower, upper, step, onChange=false){
  var that = this;
  this.min = min;
  this.max = max;
  if(this.max<this.min){
    var temp = this.min;
    this.min = this.max;
    this.max = temp;
  }
  this.lower = lower;
  if(this.lower<this.min){
    this.lower = this.min
  }
  if(this.lower>this.max){
    this.lower = this.max
  }
  this.upper = upper;
  if(this.upper>this.max){
    this.upper = this.max
  }
  if(this.upper<this.lower){
    this.upper = this.lower
  }
  this.step = step;
  this.onChange = onChange;
  this.lowerHandled = false;
  this.upperHandled = false;

  $(document).mouseup(function(){
    that.lowerHandled = false;
    that.lowerDiv.removeClass("active");
    that.upperHandled = false;
    that.upperDiv.removeClass("active");
  }).mousemove(function(event){
    that.mousemove(event);
  });
  this.div = $("<div>").addClass("slider");
  this.lowerInput = $("<input>").val(this.lower).keyup(function(){
    that.setLower(parseFloat(that.lowerInput.val()), false);
  }).appendTo(this.div);
  this.range = $("<div>").addClass("slider-range").appendTo(this.div);
  this.lowerDiv = $("<div>").addClass("slider-thumb").css("left", (this.getLowerRatio()*100)+"%").mousedown(function(){
    that.lowerHandled = true;
    that.lowerDiv.addClass("active");
  }).appendTo(this.range);
  this.upperDiv = $("<div>").addClass("slider-thumb").css("left", (this.getUpperRatio()*100)+"%").mousedown(function(){
    that.upperHandled = true;
    that.upperDiv.addClass("active");
  }).appendTo(this.range);
  this.upperInput = $("<input>").val(this.upper).keyup(function(){
    that.setUpper(parseFloat(that.upperInput.val()), false);
  }).appendTo(this.div);
}

Slider.prototype.getLowerRatio = function(){
  return (this.lower-this.min)/(this.max-this.min);
}

//lower is the value to set lower, correct is if we can correct the value if out of bound (if the false value is rejected)
Slider.prototype.setLower = function(lower, correct=true){
  if(!isNaN(lower)){
    lower -= lower % this.step;
    if(lower<this.min){
      if(correct){
        lower = this.min;
      }else{
        return false;
      }
    }
    if(lower>this.max){
      if(correct){
        lower = this.max;
      }else{
        return false;
      }
    }
    if(lower>this.upper){
      if(correct){
        this.setUpper(lower, correct);
      }else{
        return false;
      }
    }
    this.lower = lower;
    this.lowerInput.val(this.lower);
    this.lowerDiv.css("left", (this.getLowerRatio()*100)+"%");
    this.triggerOnChange();
    return true;
  }
  return false;
}

//upper is the value to set upper, correct is if we can correct the value if out of bound (if the false value is rejected)
Slider.prototype.setUpper = function(upper, correct=true){
  if(!isNaN(upper)){
    upper -= upper%this.step;
    if(upper<this.min){
      if(correct){
        upper = this.min;
      }else{
        return false;
      }
    }
    if(upper<this.lower){
      if(correct){
        this.setLower(upper, correct);
      }else{
        return false;
      }
    }
    if(upper>this.max){
      if(correct){
        upper = this.max;
      }else{
        return false;
      }
    }
    this.upper = upper;
    this.upperInput.val(this.upper);
    this.upperDiv.css("left", (this.getUpperRatio()*100)+"%");
    this.triggerOnChange();
    return true;
  }
  return false;
}

Slider.prototype.getUpperRatio = function(){
  return (this.upper-this.min)/(this.max-this.min);
}

Slider.prototype.mousemove = function(event){
  if(this.lowerHandled){
    this.setLower(((event.pageX-this.range.offset().left)/this.range.width())*(this.max-this.min)+this.min);
  }else if(this.upperHandled){
    this.setUpper(((event.pageX-this.range.offset().left)/this.range.width())*(this.max-this.min)+this.min);
  }
}

Slider.prototype.triggerOnChange = function(){
  if (this.onChange) {
    this.onChange(this)
  }
}
