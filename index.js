$(document).ready(function () {
  // Use mustache.js templating to create layout
  var html = Mustache.to_html($('#template').html());

  $('#main').replaceWith(html);

  // For each image:
  // Once image is loaded, get dominant color and palette and display them.
  $('img').bind('load', function (event) {
    // check if swatches already contain colours in them
    if ($('.swatches').children().length >= 10) {
      $('.swatches').children().slice(0, 10).remove();
    }
    var image = event.target;
    var $image = $(image);
    var imageSection = $image.closest('.imageSection');
    var appendColors = function (colors, root) {
      $.each(colors, function (index, value) {
        var swatchEl = $('<div>', { class: 'swatch' }).css(
          'background-color',
          'rgba(' + value + ', 1)'
        );
        root.append(swatchEl);
      });
    };

    // Dominant Color
    var dominantColor = getDominantColor(image);
    var dominantSwatch = imageSection.find('.dominantColor .swatches');
    appendColors([dominantColor], dominantSwatch);

    // Palette
    var colorCount = $image.attr('data-colorcount') ? $image.data('colorcount') : 10;
    var medianPalette = createPalette(image, colorCount);
    var medianCutPalette = imageSection.find('.medianCutPalette .swatches');
    appendColors(medianPalette, medianCutPalette);
  });
});
