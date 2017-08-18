/**
 * Parallax-scene.JS (MVC PATTERN)
 * Build interactive scenes with HTML5 data attributes.
 *
 * According to the defined animation formulas in model, each scene element in DOM prepares its own function
 * and included in a container function. So there is not necessary "if-else" when rendering.
 *
 * @version : v1.0
 * @dependency : Pure JavaScript.
 *
 * @author : Yunus Bayraktaroğlu <github.com/yunusbayraktaroglu/parallax-scene-js> <behance.com/yunusbayraktaroglu>
 *
**/

"use strict";

Function.prototype.extend = function() {

   var fns = [this].concat( [].slice.call(arguments) );
   return function() {
      for ( var i = 0; i < fns.length; i++ ) {
         fns[i].apply(this, arguments);
      }
   };
};

// SCENE MODEL
//
var SceneModel = function() {

   this.sceneProperties = {};
   this.currentInteractSpecs = {};
   this._root = this;
};

SceneModel.prototype = {

   setup: function( $scene, $sceneLayers ) {

      // All animation functions will be injected into this function
      this.sceneAnimator = function(){};

      this.sceneProperties.sceneWidth = $scene.offsetWidth;
      this.sceneProperties.sceneHeight = $scene.offsetHeight;
      this.sceneProperties.transformPrefix = this.getTransformPrefix();
      this.sceneProperties.interactionWay = this.getInteractionWay();

      for ( var i = 0; i < $sceneLayers.length; i++ ) {
         this.sceneAnimator = this.sceneAnimator.extend( this.functionFactory($sceneLayers[i],this.sceneProperties.transformPrefix) );
      }

      // Align view to center
      this.currentInteractSpecs.X = this.sceneProperties.sceneWidth / 2;
      this.currentInteractSpecs.Y = this.sceneProperties.sceneHeight / 2;
      this.sceneAnimator();
   },

   // Get clients device properties
   //
   getTransformPrefix: function() {
      var testEl = document.createElement('div');
      if (testEl.style.transform == null) {
         var vendors = ['Webkit', 'Moz', 'ms'];
         for (var vendor in vendors) {
            if (testEl.style[vendors[vendor] + 'Transform'] !== undefined) {
               return vendors[vendor] + 'Transform';
            }
         }
      }
      return 'transform';
   },

   getInteractionWay: function() {
      var isTouchDevice = navigator.userAgent.match(/(iPhone|iPod|iPad|Android|playbook|silk|BlackBerry|BB10|Windows Phone|Tizen|Bada|webOS|IEMobile|Opera Mini)/);
      if (isTouchDevice) {
         return "touch";
      } else {
         return "mouse";
      }
   },

   // Animation Formulas
   //
   functionFactory: function( $layer, transformPrefix ) {

      var root = this._root;

      var $layerWidth = $layer.offsetWidth,
          $layerHeight = $layer.offsetHeight,
          $layerAnimationData = $layer.getAttribute("data-scene").split(","),
          ANIMATION_TYPE = $layerAnimationData[0];

      switch ( ANIMATION_TYPE ) {

         // TRANSLATE ANIMATION 1 - Value of 1 provides element to 50% movement for each direction.
         case "translateBoth" :

            var maxTranslateX = this.getMaxTranslate( $layerWidth, this.sceneProperties.sceneWidth ),
                maxTranslateY = this.getMaxTranslate( $layerHeight, this.sceneProperties.sceneHeight ),
                densityX = this.setLimitedDensity( maxTranslateX, this.sceneProperties.sceneWidth, $layerAnimationData[1] ),
                densityY = this.setLimitedDensity( maxTranslateY, this.sceneProperties.sceneHeight, $layerAnimationData[2] ),
                centerX = this.sceneProperties.sceneWidth / 2,
                centerY = this.sceneProperties.sceneHeight / 2;

            // Prepare function
            return function() {
               var X = ( ( root.currentInteractSpecs.X - centerX ) * densityX - ( maxTranslateX / 2 ) ).toFixed(2),
                   Y = ( ( root.currentInteractSpecs.Y - centerY ) * densityY - ( maxTranslateY / 2 ) ).toFixed(2);
               $layer.style[ transformPrefix ] = 'translate3d(' + X + '%,' + Y + '%,0)';

            };
            break;


         // TRANSLATE ANIMATION 2 - Value of 1 provides element to 50% movement for each direction.
         case "translateFree" :

            var densityX = 100 * $layerAnimationData[1] / this.sceneProperties.sceneWidth,
                densityY = 100 * $layerAnimationData[2] / this.sceneProperties.sceneHeight,
                centerX = this.sceneProperties.sceneWidth / 2,
                centerY = this.sceneProperties.sceneHeight / 2;

            // Prepare function
            return function() {
               var X = ( ( root.currentInteractSpecs.X - centerX ) * densityX ).toFixed(2) + "%",
                   Y = ( ( root.currentInteractSpecs.Y - centerY ) * densityY ).toFixed(2) + "%";
               $layer.style[ transformPrefix ] = 'translate3d(' + X + ',' + Y + ' ,0)';
            };
            break;


         // OPACITY ANIMATION - Movement of the mouse changes the opacity of the element.
         //
         case "opacity" :

            var $sceneWidth = this.sceneProperties.sceneWidth,
                directionValue = ( $layerAnimationData[2] === 'ltr' ) ? 1 : 0;

            // Prepare function
            return function () {
               $layer.style.opacity = ( root.currentInteractSpecs.X / Number( $sceneWidth / 2 * $layerAnimationData[1] ) + directionValue ).toFixed(2);
            };
            break;
      }
   },

   // Calculates the maximum overflow value of elements greater than viewport
   // Px = $_layerWidth - $_sceneWidth
   // Percent = Math.floor((100 * ($_layerWidth - $_sceneWidth)) / $_layerWidth)
   getMaxTranslate: function( $_layerWidth, $_sceneWidth ) {
      return Math.floor((100 * ($_layerWidth - $_sceneWidth)) / $_layerWidth);
   },

   // Calculates the maximum overflow value of elements greater than viewport
   // Value of 1 given by user gives the maximum value the element can reach without overflowing
   setLimitedDensity : function( maxTranslateXY, sceneWH, userRatio ) {
      var maxMouseMove = maxTranslateXY / sceneWH;
      return Number( maxMouseMove / userRatio ).toFixed(5);
   }

};


// SCENE VIEW
//
var SceneView = function(model, scene) {

   this.model = model;
   this.$scene = document.querySelector( scene );
   this.$sceneLayers = this.$scene.querySelectorAll('[data-scene]');
   this._root = this;
   this.init();
};

SceneView.prototype = {

   init: function() {
      this.setupScene()
          .setupHandler()
          .openControls();
   },

   setupScene: function() {
      this.model.setup( this.$scene, this.$sceneLayers );
      return this;
   },
   setupHandler: function() {
      this.handlers.mouseMoveHandler = this.handlers.mouseMoveHandler.bind(this);
      this.handlers.touchStartHandler = this.handlers.touchStartHandler.bind(this);
      this.handlers.touchMoveHandler = this.handlers.touchMoveHandler.bind(this);
      this.reSetup = this.reSetup.bind(this);
      return this;
   },
   openControls: function() {
      window.addEventListener("resize", this.reSetup );
      if ( this.model.sceneProperties.interactionWay === "touch" ) {
         this.$scene.addEventListener("touchstart", this.handlers.touchStartHandler, {passive: true} );
         this.$scene.addEventListener("touchmove", this.handlers.touchMoveHandler, {passive: true} );
      } else {
         this.$scene.addEventListener("mousemove", this.handlers.mouseMoveHandler, {passive: true} );
      }
      this.ready = true;
   },

   reSetup: function() {
      var root = this._root;
      clearTimeout(window.resizedFinished);
      window.resizedFinished = setTimeout(function(){
         root.setupScene();
      }, 150);
   },

   // Interaction handlers
   //
   handlers : {

      // Mouse
      mouseMoveHandler: function(e) {

         if ( this.ready ) {
            this.ready = false;
            this.model.currentInteractSpecs.X = e.pageX;
            this.model.currentInteractSpecs.Y = e.pageY;
            this.model.sceneAnimator();
            this.ready = true;
         }
      },

      // Touch
      touchStartHandler: function(e) {

         this.model.currentInteractSpecs.startX = e.touches[0].pageX;
         this.model.currentInteractSpecs.startY = e.touches[0].pageY;
      },

      touchMoveHandler: function(e) {

         if ( this.ready ) {

            this.ready = false;

            this.model.currentInteractSpecs.X -= (this.model.currentInteractSpecs.startX - e.touches[0].pageX) * .05;
            this.model.currentInteractSpecs.Y -= (this.model.currentInteractSpecs.startY - e.touches[0].pageY) * .05;

            // Check overflow
            if ( this.model.currentInteractSpecs.X > this.model.sceneProperties.sceneWidth ) {
               this.model.currentInteractSpecs.X = this.model.sceneProperties.sceneWidth;
            }
            if ( this.model.currentInteractSpecs.X < 0 ) {
               this.model.currentInteractSpecs.X = 0;
            }
            if ( this.model.currentInteractSpecs.Y > this.model.sceneProperties.sceneHeight ) {
               this.model.currentInteractSpecs.Y = this.model.sceneProperties.sceneHeight;
            }
            if ( this.model.currentInteractSpecs.Y < 0 ) {
               this.model.currentInteractSpecs.Y = 0;
            }

            // Complete animation
            this.model.sceneAnimator();
            this.ready = true;
         }
      }
   }
};


// SCENE CONTROLLER
//
var SceneController = function (model, view) {

   this.model = model;
   this.view = view;
};

SceneController.prototype = {};