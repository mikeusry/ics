/**
 * @file
 * Views Slideshow Xtra Javascript.
 */
(function ($) {
  Drupal.behaviors.viewsSlideshowXtraOverlay = {
    attach: function (context) {

      // Return if there are no vsx elements on the page
      if ($('.views-slideshow-xtra-overlay').length == 0) {
        return;
      }

      // Hide all overlays for all slides.
      $('.views-slideshow-xtra-overlay-row').hide();

      var pageX = 0, pageY = 0, timeout;

      // Modify the slideshow(s) that have a vsx overlay.
      $('.views_slideshow_main').each(function() {
        var slideshowMain = $(this);

        // Get the view for this slideshow
        var view = slideshowMain.closest('.view');

        // Process the view if it has at least one overlay.
        if ($('.views-slideshow-xtra-overlay', view).length > 0) {

          // Get the View ID and Display ID so we can get the settings.
          var viewClasses = classList(view);

          $.each( viewClasses, function(index, item) {
            // We need this code because the id of the element selected will be something like:
            // "views_slideshow_cycle_main_views_slideshow_xtra_example-page"
            // We don't want to reference the string "cycle" in our code, and there is not a way to
            // get the "View ID - Display ID" substring from the id string, unless the string "cycle"
            // is referenced in a string manipulation function.

            // Get the View ID
            if((/^view-id-/).test(item)) {
              viewId = item.substring('view-id-'.length);
            }

            // Get the Display ID
            if((/^view-display-id-/).test(item)) {
              viewDisplayId = item.substring('view-display-id-'.length);
            }

          });

          if(typeof viewId != "undefined") {

            // Get the settings.
            var settings = Drupal.settings.viewsSlideshowXtraOverlay[viewId + '-' + viewDisplayId];

            // Set Pause after mouse movement setting.
            if (settings.hasOwnProperty('pauseAfterMouseMove')) {
              var pauseAfterMouseMove = settings.pauseAfterMouseMove;
              if (pauseAfterMouseMove > 0) {
                $(this).mousemove(function(e) {
                  if (pageX - e.pageX > 5 || pageY - e.pageY > 5) {
                    Drupal.viewsSlideshow.action({ "action": 'pause', "slideshowID": viewId + '-' + viewDisplayId });
                    clearTimeout(timeout);
                    timeout = setTimeout(function() {
                        Drupal.viewsSlideshow.action({ "action": 'play', "slideshowID": viewId + '-' + viewDisplayId });
                        }, 2000);
                  }
                  pageX = e.pageX;
                  pageY = e.pageY;
                });
              }
            }

          }

          // Process the overlay(s).
          $('.views-slideshow-xtra-overlay:not(.views-slideshow-xtra-overlay-processed)', view).addClass('views-slideshow-xtra-overlay-processed').each(function() {
              // Remove the overlay html from the dom
              var overlayHTML = $(this).detach();
              // Attach the overlay to the slideshow main div.
              $(overlayHTML).appendTo(slideshowMain);
          });

        }

      });
    }
  };

  Drupal.viewsSlideshowXtraOverlay = Drupal.viewsSlideshowXtraOverlay || {};

  Drupal.viewsSlideshowXtraOverlay.transitionBegin = function (options) {

    // Hide all overlays for all slides.
    $('#views_slideshow_cycle_main_' + options.slideshowID + ' .views-slideshow-xtra-overlay-row').hide();

    // Show the overlays for the current slide.
    $('#views_slideshow_cycle_main_' + options.slideshowID + ' [id^="views-slideshow-xtra-overlay-"]' + ' .views-slideshow-xtra-overlay-row-' + options.slideNum).each(function() {

      // Get the overlay settings.
      var overlay = $(this);
      var overlayContainerId = overlay.parent().attr('id');
      var settings = Drupal.settings.viewsSlideshowXtraOverlay[overlayContainerId];

      // Fade in or show overlay with optional delay.
      setTimeout(function() {
        if(settings.overlayFadeIn) {
          overlay.fadeIn(settings.overlayFadeIn);
        } else {
          overlay.show();
        }
      },
        settings.overlayDelay
      );

      // Fade out overlay with optional delay.
      if(settings.overlayFadeOut) {
        setTimeout(function() {
          overlay.fadeOut(settings.overlayFadeOut);
        },
        settings.overlayFadeOutDelay
        );
      }

    });
  };

  function classList(elem){
    var classList = elem.attr('class').split(/\s+/);
     var classes = new Array(classList.length);
     $.each( classList, function(index, item){
         classes[index] = item;
     });

     return classes;
  }

})(jQuery);
;
(function($) {

Drupal.admin = Drupal.admin || {};
Drupal.admin.behaviors = Drupal.admin.behaviors || {};
Drupal.admin.hashes = Drupal.admin.hashes || {};

/**
 * Core behavior for Administration menu.
 *
 * Test whether there is an administration menu is in the output and execute all
 * registered behaviors.
 */
Drupal.behaviors.adminMenu = {
  attach: function (context, settings) {
    // Initialize settings.
    settings.admin_menu = $.extend({
      suppress: false,
      margin_top: false,
      position_fixed: false,
      tweak_modules: false,
      tweak_permissions: false,
      tweak_tabs: false,
      destination: '',
      basePath: settings.basePath,
      hash: 0,
      replacements: {}
    }, settings.admin_menu || {});
    // Check whether administration menu should be suppressed.
    if (settings.admin_menu.suppress) {
      return;
    }
    var $adminMenu = $('#admin-menu:not(.admin-menu-processed)', context);
    // Client-side caching; if administration menu is not in the output, it is
    // fetched from the server and cached in the browser.
    if (!$adminMenu.length && settings.admin_menu.hash) {
      Drupal.admin.getCache(settings.admin_menu.hash, function (response) {
          if (typeof response == 'string' && response.length > 0) {
            $('body', context).append(response);
          }
          var $adminMenu = $('#admin-menu:not(.admin-menu-processed)', context);
          // Apply our behaviors.
          Drupal.admin.attachBehaviors(context, settings, $adminMenu);
          // Allow resize event handlers to recalculate sizes/positions.
          $(window).triggerHandler('resize');
      });
    }
    // If the menu is in the output already, this means there is a new version.
    else {
      // Apply our behaviors.
      Drupal.admin.attachBehaviors(context, settings, $adminMenu);
    }
  }
};

/**
 * Collapse fieldsets on Modules page.
 */
Drupal.behaviors.adminMenuCollapseModules = {
  attach: function (context, settings) {
    if (settings.admin_menu.tweak_modules) {
      $('#system-modules fieldset:not(.collapsed)', context).addClass('collapsed');
    }
  }
};

/**
 * Collapse modules on Permissions page.
 */
Drupal.behaviors.adminMenuCollapsePermissions = {
  attach: function (context, settings) {
    if (settings.admin_menu.tweak_permissions) {
      // Freeze width of first column to prevent jumping.
      $('#permissions th:first', context).css({ width: $('#permissions th:first', context).width() });
      // Attach click handler.
      $modules = $('#permissions tr:has(td.module)', context).once('admin-menu-tweak-permissions', function () {
        var $module = $(this);
        $module.bind('click.admin-menu', function () {
          // @todo Replace with .nextUntil() in jQuery 1.4.
          $module.nextAll().each(function () {
            var $row = $(this);
            if ($row.is(':has(td.module)')) {
              return false;
            }
            $row.toggleClass('element-hidden');
          });
        });
      });
      // Get fragment from current URL.
      var fragment = window.location.hash || '#';
      // Collapse all but the targeted permission rows set.
      $modules.not(':has(' + fragment + ')').trigger('click.admin-menu');
    }
  }
};

/**
 * Apply margin to page.
 *
 * Note that directly applying marginTop does not work in IE. To prevent
 * flickering/jumping page content with client-side caching, this is a regular
 * Drupal behavior.
 */
Drupal.behaviors.adminMenuMarginTop = {
  attach: function (context, settings) {
    if (!settings.admin_menu.suppress && settings.admin_menu.margin_top) {
      $('body:not(.admin-menu)', context).addClass('admin-menu');
    }
  }
};

/**
 * Retrieve content from client-side cache.
 *
 * @param hash
 *   The md5 hash of the content to retrieve.
 * @param onSuccess
 *   A callback function invoked when the cache request was successful.
 */
Drupal.admin.getCache = function (hash, onSuccess) {
  if (Drupal.admin.hashes.hash !== undefined) {
    return Drupal.admin.hashes.hash;
  }
  $.ajax({
    cache: true,
    type: 'GET',
    dataType: 'text', // Prevent auto-evaluation of response.
    global: false, // Do not trigger global AJAX events.
    url: Drupal.settings.admin_menu.basePath.replace(/admin_menu/, 'js/admin_menu/cache/' + hash),
    success: onSuccess,
    complete: function (XMLHttpRequest, status) {
      Drupal.admin.hashes.hash = status;
    }
  });
};

/**
 * TableHeader callback to determine top viewport offset.
 *
 * @see toolbar.js
 */
Drupal.admin.height = function() {
  var $adminMenu = $('#admin-menu');
  var height = $adminMenu.outerHeight();
  // In IE, Shadow filter adds some extra height, so we need to remove it from
  // the returned height.
  if ($adminMenu.css('filter') && $adminMenu.css('filter').match(/DXImageTransform\.Microsoft\.Shadow/)) {
    height -= $adminMenu.get(0).filters.item("DXImageTransform.Microsoft.Shadow").strength;
  }
  return height;
};

/**
 * @defgroup admin_behaviors Administration behaviors.
 * @{
 */

/**
 * Attach administrative behaviors.
 */
Drupal.admin.attachBehaviors = function (context, settings, $adminMenu) {
  if ($adminMenu.length) {
    $adminMenu.addClass('admin-menu-processed');
    $.each(Drupal.admin.behaviors, function() {
      this(context, settings, $adminMenu);
    });
  }
};

/**
 * Apply 'position: fixed'.
 */
Drupal.admin.behaviors.positionFixed = function (context, settings, $adminMenu) {
  if (settings.admin_menu.position_fixed) {
    $adminMenu.addClass('admin-menu-position-fixed');
    $adminMenu.css('position', 'fixed');
  }
};

/**
 * Move page tabs into administration menu.
 */
Drupal.admin.behaviors.pageTabs = function (context, settings, $adminMenu) {
  if (settings.admin_menu.tweak_tabs) {
    var $tabs = $(context).find('ul.tabs.primary');
    $adminMenu.find('#admin-menu-wrapper > ul').eq(1)
      .append($tabs.find('li').addClass('admin-menu-tab'));
    $(context).find('ul.tabs.secondary')
      .appendTo('#admin-menu-wrapper > ul > li.admin-menu-tab.active')
      .removeClass('secondary');
    $tabs.remove();
  }
};

/**
 * Perform dynamic replacements in cached menu.
 */
Drupal.admin.behaviors.replacements = function (context, settings, $adminMenu) {
  for (var item in settings.admin_menu.replacements) {
    $(item, $adminMenu).html(settings.admin_menu.replacements[item]);
  }
};

/**
 * Inject destination query strings for current page.
 */
Drupal.admin.behaviors.destination = function (context, settings, $adminMenu) {
  if (settings.admin_menu.destination) {
    $('a.admin-menu-destination', $adminMenu).each(function() {
      this.search += (!this.search.length ? '?' : '&') + Drupal.settings.admin_menu.destination;
    });
  }
};

/**
 * Apply JavaScript-based hovering behaviors.
 *
 * @todo This has to run last.  If another script registers additional behaviors
 *   it will not run last.
 */
Drupal.admin.behaviors.hover = function (context, settings, $adminMenu) {
  // Hover emulation for IE 6.
  if ($.browser.msie && parseInt(jQuery.browser.version) == 6) {
    $('li', $adminMenu).hover(
      function () {
        $(this).addClass('iehover');
      },
      function () {
        $(this).removeClass('iehover');
      }
    );
  }

  // Delayed mouseout.
  $('li.expandable', $adminMenu).hover(
    function () {
      // Stop the timer.
      clearTimeout(this.sfTimer);
      // Display child lists.
      $('> ul', this)
        .css({left: 'auto', display: 'block'})
        // Immediately hide nephew lists.
        .parent().siblings('li').children('ul').css({left: '-999em', display: 'none'});
    },
    function () {
      // Start the timer.
      var uls = $('> ul', this);
      this.sfTimer = setTimeout(function () {
        uls.css({left: '-999em', display: 'none'});
      }, 400);
    }
  );
};

/**
 * @} End of "defgroup admin_behaviors".
 */

})(jQuery);
;
