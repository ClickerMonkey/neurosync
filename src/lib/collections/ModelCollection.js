
/**
 * An extension of the {@link Rekord.Collection} class for {@link Rekord.Model}
 * instances.
 *
 * @constructor
 * @memberof Rekord
 * @extends Rekord.Collection
 * @param {Rekord.Database} database -
 *    The database for the models in this collection.
 * @param {modelInput[]} [models] -
 *    The initial array of models in this collection.
 * @param {Boolean} [remoteData=false] -
 *    If the models array is from a remote source. Remote sources place the
 *    model directly into the database while local sources aren't stored in the
 *    database until they're saved.
 * @see Rekord.Models.boot
 * @see Rekord.Models.collect
 */
function ModelCollection(database, models, remoteData)
{
  this.init( database, models, remoteData );
}

/**
 * The map of models which keeps an index (by model key) of the models.
 *
 * @memberof Rekord.ModelCollection#
 * @member {Rekord.Map} map
 */

/**
 * The database for the models in this collection.
 *
 * @memberof Rekord.ModelCollection#
 * @member {Rekord.Database} database
 */

extendArray( Collection, ModelCollection,
{

  /**
   * Initializes the model collection by setting the database, the initial set
   * of models, and whether the initial set of models is from a remote source.
   *
   * @method
   * @memberof Rekord.ModelCollection#
   * @param {Rekord.Database} database -
   *    The database for the models in this collection.
   * @param {modelInput[]} [models] -
   *    The initial array of models in this collection.
   * @param {Boolean} [remoteData=false] -
   *    If the models array is from a remote source. Remote sources place the
   *    model directly into the database while local sources aren't stored in the
   *    database until they're saved.
   * @return {Rekord.ModelCollection} -
   *    The reference to this collection.
   * @emits Rekord.ModelCollection#reset
   */
  init: function(database, models, remoteData)
  {
    this.map = new Map();
    this.map.values = this;
    this.database = database;
    this.reset( models, remoteData );

    return this;
  },

  /**
   * Documented in Collection.js
   */
  sort: function(comparator, comparatorNullsFirst)
  {
    var cmp = comparator ? createComparator( comparator, comparatorNullsFirst ) : this.comparator;

    if ( !isSorted( cmp, this ) )
    {
      this.map.sort( cmp );

      this.trigger( Collection.Events.Sort, [this] );
    }

    return this;
  },

  /**
   * Takes input provided to the collection for adding, removing, or querying
   * and generates the key which uniquely identifies a model.
   *
   * @method
   * @memberof Rekord.ModelCollection#
   * @param {modelInput} input -
   *    The input to convert to a key.
   * @return {modelKey} -
   *    The key built from the input.
   */
  buildKeyFromInput: function(input)
  {
    return this.database.buildKeyFromInput( input );
  },

  /**
   * Takes input provided to this collection for adding, removing, or querying
   * and returns a model instance. An existing model can be referenced or a new
   * model can be created on the spot.
   *
   * @method
   * @memberof Rekord.ModelCollection#
   * @param {modelInput} input -
   *    The input to convert to a model instance.
   * @param {Boolean} [remoteData=false] -
   *    If the model is from a remote source. Remote sources place the model
   *    directly into the database while local sources aren't stored in the
   *    database until they're saved.
   * @return {Rekord.Model} -
   *    A model instance parsed from the input.
   */
  parseModel: function(input, remoteData)
  {
    return this.database.parseModel( input, remoteData );
  },

  /**
   * Creates a sub view of this collection known as a filtered collection. The
   * resulting collection changes when this collection changes. Any time an
   * element is added or removed to this collection it may be added or removed
   * from the filtered collection if it fits the filter function. The filter
   * function is created by passing the arguments of this function to
   * {@link Rekord.createWhere}.
   *
   * @method
   * @memberof Rekord.ModelCollection#
   * @param {whereInput} [whereProperties] -
   *    See {@link Rekord.createWhere}
   * @param {Any} [whereValue] -
   *    See {@link Rekord.createWhere}
   * @param {equalityCallback} [whereEquals] -
   *    See {@link Rekord.createWhere}
   * @return {Rekord.FilteredModelCollection} -
   *    The newly created live filtered view of this collection.
   * @see Rekord.createWhere
   */
  filtered: function(whereProperties, whereValue, whereEquals)
  {
    var filter = createWhere( whereProperties, whereValue, whereEquals );

    return new FilteredModelCollection( this, filter );
  },

  /**
   * Documented in Collection.js
   *
   * @see Rekord.ModelCollection#buildKeyFromInput
   */
  subtract: function(models, out)
  {
    var target = out || this.cloneEmpty();

    for (var i = 0; i < this.length; i++)
    {
      var a = this[ i ];
      var key = a.$key();
      var exists = false;

      if ( models instanceof ModelCollection )
      {
        exists = models.has( key );
      }
      else
      {
        for (var i = 0; i < models.length && !exists; i++)
        {
          var modelKey = this.buildKeyFromInput( models[ i ] );

          exists = (key === modelKey);
        }
      }

      if (!exists)
      {
        target.push( a );
      }
    }

    return target;
  },

  /**
   * Documented in Collection.js
   */
  intersect: function(models, out)
  {
    var target = out || this.cloneEmpty();

    for (var i = 0; i < models.length; i++)
    {
      var a = models[ i ];
      var key = this.buildKeyFromInput( a );

      if ( this.has( key ) )
      {
        target.push( a );
      }
    }

    return target;
  },

  /**
   * Documented in Collection.js
   */
  complement: function(models, out)
  {
    var target = out || this.cloneEmpty();

    for (var i = 0; i < models.length; i++)
    {
      var a = models[ i ];
      var key = this.buildKeyFromInput( a );

      if ( !this.has( key ) )
      {
        target.push( a );
      }
    }

    return target;
  },

  /**
   * Documented in Collection.js
   */
  clear: function()
  {
    return this.map.reset();
  },

  /**
   * Resets the models in this collection with a new collection of models.
   *
   * @method
   * @memberof Rekord.ModelCollection#
   * @param {modelInput[]} [models] -
   *    The initial array of models in this collection.
   * @param {Boolean} [remoteData=false] -
   *    If the models array is from a remote source. Remote sources place the
   *    model directly into the database while local sources aren't stored in the
   *    database until they're saved.
   * @return {Rekord.ModelCollection} -
   *    The reference to this collection.
   * @see Rekord.ModelCollection#parseModel
   * @emits Rekord.ModelCollection#reset
   */
  reset: function(models, remoteData)
  {
    var map = this.map;

    map.reset();

    if ( isArray( models ) )
    {
      for (var i = 0; i < models.length; i++)
      {
        var model = models[ i ];
        var parsed = this.parseModel( model, remoteData );

        if ( parsed )
        {
          map.put( parsed.$key(), parsed );
        }
      }
    }
    else if ( isObject( models ) )
    {
      var parsed = this.parseModel( models, remoteData );

      if ( parsed )
      {
        map.put( parsed.$key(), parsed );
      }
    }

    this.trigger( Collection.Events.Reset, [this] );
    this.sort();
  },

  /**
   * Returns whether this collection contains a model with the given key.
   *
   * @method
   * @memberof Rekord.ModelCollection#
   * @param {modelKey} key -
   *    The key of the model to check for existence.
   * @return {Boolean} -
   *    True if a model with the given key exists in this collection, otherwise
   *    false.
   */
  has: function(key)
  {
    return this.map.has( key );
  },

  /**
   * Returns the model in this collection with the given key.
   *
   * @method
   * @memberof Rekord.ModelCollection#
   * @param {modelKey} key -
   *    The key of the model to return.
   * @return {Rekord.Model} -
   *    The model instance for the given key, or undefined if a model wasn't
   *    found.
   */
  get: function(key)
  {
    return this.map.get( key );
  },

  /**
   * Places a model in this collection providing a key to use.
   *
   * @method
   * @memberof Rekord.ModelCollection#
   * @param {modelKey} key -
   *    The key of the model.
   * @param {Rekord.Model} model -
   *    The model instance to place in the collection.
   * @param {Boolean} [delaySort=false] -
   *    Whether automatic sorting should be delayed until the user manually
   *    calls {@link Rekord.ModelCollection#sort sort}.
   * @return {Rekord.ModelCollection} -
   *    The reference to this collection.
   * @emits Rekord.ModelCollection#add
   * @emits Rekord.ModelCollection#sort
   */
  put: function(key, model, delaySort)
  {
    this.map.put( key, model );
    this.trigger( Collection.Events.Add, [this, model] );

    if ( !delaySort )
    {
      this.sort();
    }
  },

  /**
   * Adds a model to this collection - sorting the collection if a comparator
   * is set on this collection and `delaySort` is not a specified or a true
   * value.
   *
   * @method
   * @memberof Rekord.ModelCollection#
   * @param {modelInput} input -
   *    The model to add to this collection.
   * @param {Boolean} [delaySort=false] -
   *    Whether automatic sorting should be delayed until the user manually
   *    calls {@link Rekord.ModelCollection#sort sort}.
   * @return {Rekord.ModelCollection} -
   *    The reference to this collection.
   * @emits Rekord.ModelCollection#add
   * @emits Rekord.ModelCollection#sort
   */
  add: function(input, delaySort)
  {
    var model = this.parseModel( input );

    this.map.put( model.$key(), model );
    this.trigger( Collection.Events.Add, [this, model] );

    if ( !delaySort )
    {
      this.sort();
    }

    return this;
  },

  /**
   * Adds one or more models to the end of this collection - sorting the
   * collection if a comparator is set on this collection.
   *
   * @method
   * @memberof Rekord.ModelCollection#
   * @param {...modelInput} value -
   *    The models to add to this collection.
   * @return {Number} -
   *    The new length of this collection.
   * @emits Rekord.ModelCollection#add
   * @emits Rekord.ModelCollection#sort
   */
  push: function()
  {
    var values = arguments;

    for (var i = 0; i < values.length; i++)
    {
      var model = this.parseModel( values[ i ] );

      this.map.put( model.$key(), model );
    }

    this.trigger( Collection.Events.Adds, [this, values] );
    this.sort();

    return this.length;
  },

  /**
   * @method
   * @memberof Rekord.ModelCollection#
   * @see Rekord.ModelCollection#push
   * @param {...modelInput} value -
   *    The values to add to this collection.
   * @return {Number} -
   *    The new length of this collection.
   * @emits Rekord.ModelCollection#adds
   * @emits Rekord.ModelCollection#sort
   */
  unshift: function()
  {
    return this.push.apply( this, arguments );
  },

  /**
   * Adds all models in the given array to this collection - sorting the
   * collection if a comparator is set on this collection and `delaySort` is
   * not specified or a true value.
   *
   * @method
   * @memberof Rekord.ModelCollection#
   * @param {modelInput[]} models -
   *    The models to add to this collection.
   * @param {Boolean} [delaySort=false] -
   *    Whether automatic sorting should be delayed until the user manually
   *    calls {@link Rekord.ModelCollection#sort sort}.
   * @return {Rekord.ModelCollection} -
   *    The reference to this collection.
   * @emits Rekord.ModelCollection#adds
   * @emits Rekord.ModelCollection#sort
   */
  addAll: function(models, delaySort)
  {
    if ( isArray( models ) )
    {
      for (var i = 0; i < models.length; i++)
      {
        var model = this.parseModel( models[ i ] );

        this.map.put( model.$key(), model );
      }

      this.trigger( Collection.Events.Adds, [this, models] );

      if ( !delaySort )
      {
        this.sort();
      }
    }
  },

  /**
   * @method
   * @memberof Rekord.ModelCollection#
   * @see Rekord.ModelCollection#add
   * @return {Rekord.ModelCollection} -
   *    The reference to this collection.
   * @emits Rekord.ModelCollection#add
   * @emits Rekord.ModelCollection#sort
   */
  insertAt: function(i, value, delaySort)
  {
    return this.add( value, delaySort );
  },

  /**
   * Removes the last model in this collection and returns it - sorting the
   * collection if a comparator is set on this collection and `delaySort` is
   * no specified or a true value.
   *
   * @method
   * @memberof Rekord.ModelCollection#
   * @param {Boolean} [delaySort=false] -
   *    Whether automatic sorting should be delayed until the user manually
   *    calls {@link Rekord.ModelCollection#sort sort}.
   * @return {Rekord.Model} -
   *    The model removed from the end of the collection.
   * @emits Rekord.ModelCollection#remove
   * @emits Rekord.ModelCollection#sort
   */
  pop: function(delaySort)
  {
    var i = this.length - 1;
    var removed = this[ i ];

    this.map.removeAt( i );
    this.trigger( Collection.Events.Remove, [this, removed, i] );

    if ( !delaySort )
    {
      this.sort();
    }

    return removed;
  },

  /**
   * Removes the first model in this collection and returns it - sorting the
   * collection if a comparator is set on this collection and `delaySort` is
   * no specified or a true value.
   *
   * ```javascript
   * var c = Rekord.collect(1, 2, 3, 4);
   * c.shift(); // 1
   * ```
   *
   * @method
   * @memberof Rekord.ModelCollection#
   * @param {Boolean} [delaySort=false] -
   *    Whether automatic sorting should be delayed until the user manually
   *    calls {@link Rekord.ModelCollection#sort sort}.
   * @return {Rekord.Model} -
   *    The model removed from the beginning of the collection.
   * @emits Rekord.ModelCollection#remove
   * @emits Rekord.ModelCollection#sort
   */
  shift: function(delaySort)
  {
    var removed = this[ 0 ];

    this.map.removeAt( 0 );
    this.trigger( Collection.Events.Remove, [this, removed, 0] );

    if ( !delaySort )
    {
      this.sort();
    }

    return removed;
  },

  /**
   * Removes the model in this collection at the given index `i` - sorting
   * the collection if a comparator is set on this collection and `delaySort` is
   * not specified or a true value.
   *
   * @method
   * @memberof Rekord.ModelCollection#
   * @param {Number} i -
   *    The index of the model to remove.
   * @param {Boolean} [delaySort=false] -
   *    Whether automatic sorting should be delayed until the user manually
   *    calls {@link Rekord.ModelCollection#sort sort}.
   * @return {Rekord.Model} -
   *    The model removed, or undefined if the index was invalid.
   * @emits Rekord.ModelCollection#remove
   * @emits Rekord.ModelCollection#sort
   */
  removeAt: function(i, delaySort)
  {
    var removing;

    if (i >= 0 && i < this.length)
    {
      removing = this[ i ];

      this.map.removeAt( i );
      this.trigger( Collection.Events.Remove, [this, removing, i] );

      if ( !delaySort )
      {
        this.sort();
      }
    }

    return removing;
  },

  /**
   * Removes the given model from this collection if it exists - sorting the
   * collection if a comparator is set on this collection and `delaySort` is not
   * specified or a true value.
   *
   * @method
   * @memberof Rekord.ModelCollection#
   * @param {modelInput} input -
   *    The model to remove from this collection if it exists.
   * @param {Boolean} [delaySort=false] -
   *    Whether automatic sorting should be delayed until the user manually
   *    calls {@link Rekord.ModelCollection#sort sort}.
   * @param {equalityCallback} [equals=Rekord.equalsStrict] -
   *    The function which determines whether one of the elements that exist in
   *    this collection are equivalent to the given value.
   * @return {Rekord.Model} -
   *    The element removed from this collection.
   * @emits Rekord.ModelCollection#remove
   * @emits Rekord.ModelCollection#sort
   */
  remove: function(input, delaySort)
  {
    var key = this.buildKeyFromInput( input );
    var removing = this.map.get( key );

    if ( removing )
    {
      this.map.remove( key );
      this.trigger( Collection.Events.Remove, [this, removing, input] );

      if ( !delaySort )
      {
        this.sort();
      }
    }
  },

  /**
   * Removes the given models from this collection - sorting the collection if
   * a comparator is set on this collection and `delaySort` is not specified or
   * a true value.
   *
   * @method
   * @memberof Rekord.ModelCollection#
   * @param {modelInput[]} inputs -
   *    The models to remove from this collection if they exist.
   * @param {Boolean} [delaySort=false] -
   *    Whether automatic sorting should be delayed until the user manually
   *    calls {@link Rekord.ModelCollection#sort sort}.
   * @return {Rekord.Model[]} -
   *    The models removed from this collection.
   * @emits Rekord.ModelCollection#removes
   * @emits Rekord.ModelCollection#sort
   */
  removeAll: function(inputs, delaySort)
  {
    var map = this.map;
    var removed = [];

    for (var i = 0; i < inputs.length; i++)
    {
      var key = this.buildKeyFromInput( inputs[ i ] );
      var removing = map.get( key );

      if ( removing )
      {
        map.remove( key );
        removed.push( removing );
      }
    }

    this.trigger( Collection.Events.Removes, [this, removed] );

    if ( !delaySort )
    {
      this.sort();
    }

    return removed;
  },

  /**
   * Returns the index of the given model in this collection or returns -1
   * if the model doesn't exist in this collection.
   *
   * @method
   * @memberof Rekord.ModelCollection#
   * @param {modelInput} input -
   *    The model to search for.
   * @return {Number} -
   *    The index of the model in this collection or -1 if it was not found.
   */
  indexOf: function(input)
  {
    var key = this.buildKeyFromInput( input );
    var index = this.map.indices[ key ];

    return index === undefined ? -1 : index;
  },

  /**
   * Rebuilds the internal index which maps keys to the index of the model in
   * this collection.
   *
   * @method
   * @memberof Rekord.ModelCollection#
   * @return {Rekord.ModelCollection} -
   *    The reference to this collection.
   */
  rebuild: function()
  {
    this.map.rebuildIndex();
  },

  /**
   * Returns the array of keys that correspond to the models in this collection.
   *
   * @method
   * @memberof Rekord.ModelCollection#
   * @return {modelKey[]} -
   *    The array of model keys.
   */
  keys: function()
  {
    return this.map.keys;
  },

  /**
   * Reverses the order of models in this collection.
   *
   * @method
   * @memberof Rekord.ModelCollection#
   * @return {Rekord.ModelCollection} -
   *    The reference to this collection.
   * @emits Rekord.ModelCollection#updates
   */
  reverse: function()
  {
    this.map.reverse();

    this.trigger( Collection.Events.Updates, [this] );

    return this;
  },

  /**
   * Removes the models from this collection where the given expression is true.
   * The first argument, if `true`, can call {@link Rekord.Model#$remove} on each
   * model removed from this colleciton.
   *
   * @method
   * @memberof Rekord.ModelCollection#
   * @param {Boolean} [callRemove=false] -
   *    Whether {@link Rekord.Model#$remove} should be called on each removed model.
   * @param {whereInput} [whereProperties] -
   *    See {@link Rekord.createWhere}
   * @param {Any} [whereValue] -
   *    See {@link Rekord.createWhere}
   * @param {equalityCallback} [whereEquals] -
   *    See {@link Rekord.createWhere}
   * @return {Rekord.Model[]} -
   *    An array of models removed from this collection.
   * @emits Rekord.ModelCollection#removes
   * @emits Rekord.ModelCollection#sort
   */
  removeWhere: function(callRemove, whereProperties, whereValue, whereEquals)
  {
    var where = createWhere( whereProperties, whereValue, whereEquals );
    var removed = [];

    for (var i = 0; i < this.length; i++)
    {
      var model = this[ i ];
      var key = model.$key();

      if ( where( model ) )
      {
        this.map.remove( key );
        removed.push( model );

        if ( callRemove )
        {
          model.$remove();
        }
      }
    }

    this.trigger( Collection.Events.Removes, [this, removed] );
    this.sort();

    return removed;
  },

  /**
   * Updates the given property(s) in all models in this collection with the
   * given value. If `avoidSave` is not a truthy value then
   * {@link Rekord.Model#$save} is called on every model in this collection.
   *
   * @method
   * @memberof Rekord.ModelCollection#
   * @param {String|Object} props -
   *    The property or properties to update.
   * @param {Any} [value] -
   *    The value to set if a String `props` is given.
   * @param {Boolean} [remoteData=false] -
   *    If the properties are from a remote source. Remote sources place the
   *    model directly into the database while local sources aren't stored in the
   *    database until they're saved.
   * @param {Boolean} [avoidSave=false] -
   *    True for NOT calling {@link Rekord.Model#$save}, otherwise false.
   * @return {Rekord.ModelCollection} -
   *    The reference to this collection.
   * @emits Rekord.ModelCollection#updates
   * @emits Rekord.ModelCollection#sort
   */
  update: function(props, value, remoteData, avoidSave)
  {
    for (var i = 0; i < this.length; i++)
    {
      var model = this[ i ];

      model.$set( props, value, remoteData );

      if ( !avoidSave )
      {
        model.$save();
      }
    }

    this.trigger( Collection.Events.Updates, [this, this] );
    this.sort();

    return this;
  },

  /**
   * Updates the given property(s) in models in this collection which pass the
   * `where` function with the given value. If `avoidSave` is not a truthy value
   * then {@link Rekord.Model#$save} is called on every model in this collection.
   *
   * @method
   * @memberof Rekord.ModelCollection#
   * @param {whereCallback} where -
   *    The function which determines whether a model should be updated.
   * @param {String|Object} props -
   *    The property or properties to update.
   * @param {*} [value] -
   *    The value to set if a String `props` is given.
   * @param {Boolean} [remoteData=false] -
   *    If the properties are from a remote source. Remote sources place the
   *    model directly into the database while local sources aren't stored in the
   *    database until they're saved.
   * @param {Boolean} [avoidSave=false] -
   *    True for NOT calling {@link Rekord.Model#$save}, otherwise false.
   * @return {Rekord.Model[]} -
   *    An array of models updated.
   * @emits Rekord.ModelCollection#updates
   * @emits Rekord.ModelCollection#sort
   */
  updateWhere: function(where, props, value, remoteData, avoidSave)
  {
    var updated = [];

    for (var i = 0; i < this.length; i++)
    {
      var model = this[ i ];

      if ( where( model ) )
      {
        model.$set( props, value, remoteData );

        if ( !autoSave )
        {
          model.$save();
        }

        updated.push( model );
      }
    }

    this.trigger( Collection.Events.Updates, [this, updated] );
    this.sort();

    return updated;
  },

  /**
   * Returns a clone of this collection.
   *
   * @method
   * @memberof Rekord.ModelCollection#
   * @return {Rekord.ModelCollection} -
   *    The reference to a clone collection.
   */
  clone: function()
  {
    return new ModelCollection( this.database, this, true );
  },

  /**
   * Returns an empty clone of this collection.
   *
   * @method
   * @memberof Rekord.ModelCollection#
   * @return {Rekord.ModelCollection} -
   *    The reference to a clone collection.
   */
  cloneEmpty: function()
  {
    return new ModelCollection( this.database );
  }

});