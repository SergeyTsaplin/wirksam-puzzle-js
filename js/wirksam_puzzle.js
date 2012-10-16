/**
 * Скрипт для работы с пазлами
 * 
 * @requires jquery.js
 * @requires jquery-ui.js
 */

/**
 * Объект для хранения глобальных данных о текущем состоянии пазла
 */
var puzzle = {
  widthCount        : 3,
  heightCount       : 3,
  horizontalOverlay : 34,
  verticalOverlay   : 31,
  maxZIndex         : 0,
  delta             : 5,
  parts             : [],
  imgSize           : {width: 201, height: 150}
}

/**
 * Метод для поиска текущего максимального значения z-index среди элементов пазла
 */
var getMaxZIndex = function(){
  var maxZIndex = 0;
  for (var i=0; i<puzzle.parts.length; i++){
    var curZIndex = parseInt($(puzzle.parts[i]).css('z-index'), 10);
    if (curZIndex > maxZIndex){
        maxZIndex = curZIndex;
    };
  };
  puzzle.maxZIndex = maxZIndex;
  return maxZIndex;
};

/**
 * Обработчик события начала перетаскивания
 */
var onDraggingStart = function(e, obj){
  var curZIndex;
  if (puzzle.maxZIndex === 0) {
    curZIndex = getMaxZIndex();
  } else {
    curZIndex = puzzle.maxZIndex;
  };
  puzzle.maxZIndex = curZIndex + 1;
  $(this).css('z-index', curZIndex + 1);
};

/**
 * Функция проверяет, есть ли совмещения с другими элементами с точностью до delta пикселей
 */
var hasPartsInDelta = function(){
  return false; 
};

var getImageIndex = function(img){
  var vRegExp = new RegExp(/\d*$/);
  return parseInt(vRegExp.exec($(img).attr('id')), 10)-1;
};

var getImageRow = function(index){
  return (index - index % puzzle.widthCount) / puzzle.widthCount;
};

var getImageCol = function(index){
  return index % puzzle.widthCount
};

/**
 * Функция проверяет возможность соединения 2-х частей пазла и возвращает место соединения относительно первого объекта
 */
var isJoinable = function(obj1, obj2){
  var vRegExp = new RegExp(/\d*$/);
  var indx1 = getImageIndex(obj1);
  var indx2 = getImageIndex(obj2);
  var obj1Row = getImageRow(indx1);
  var obj2Row = getImageRow(indx2);
  var obj1Col = getImageCol(indx1);
  var obj2Col = getImageCol(indx2);
  
  if (obj1Row === obj2Row){
    if ((obj1Col - obj2Col) === 1) return 'Left'
    else if ((obj1Col - obj2Col) === -1) return 'Right'
    else return false;
  } else if(obj1Col === obj2Col){
    if ((obj1Row - obj2Row) === 1) return 'Top'
    else if ((obj1Row - obj2Row) === -1) return 'Bottom'
    else return false;
  } else {
    return false;
  }
}

/**
 * Функция проверяет достаточно ли близко находятся элементы, чтобы их объединить
 */
var isJoinEnable = function(curImg, curJoinImage, joinPosition){
  var curOffset = $(curImg).offset();
  var curJoinOffset = $(curJoinImage).offset();
  switch (joinPosition){
    case 'Top':
      if ((Math.abs(curOffset.left - curJoinOffset.left) <= puzzle.delta)
            && Math.abs(curOffset.top - (curJoinOffset.top+puzzle.imgSize.height-puzzle.verticalOverlay) <= puzzle.delta)){
        return true;      
      } else {
        return false;
      };
      break;
    case 'Bottom':
      if ((Math.abs(curOffset.left - curJoinOffset.left) <= puzzle.delta)
            && Math.abs(curJoinOffset.top - (curOffset.top+puzzle.imgSize.height-puzzle.verticalOverlay) <= puzzle.delta)){
        return true;      
      } else {
        return false;
      };
      break;
    case 'Left':
      if ((Math.abs(curOffset.top - curJoinOffset.top) <= puzzle.delta)
            && Math.abs(curOffset.left - (curJoinOffset.left+puzzle.imgSize.width-puzzle.horizontalOverlay) <= puzzle.delta)){
        return true;      
      } else {
        return false;
      };
      break;
    case 'Right':
       if ((Math.abs(curOffset.top - curJoinOffset.top) <= puzzle.delta)
            && Math.abs(curJoinOffset.left - (curOffset.left+puzzle.imgSize.width-puzzle.horizontalOverlay) <= puzzle.delta)){
        return true;      
      } else {
        return false;
      };
      break;
    default:
      return false;
  };
};

var hasCorrectJoin = function(obj){
  var curPart = $(obj);
  var joinPart;
  $(curPart.children()).each(function(key, curImg){
    var curOffset = $(curImg).offset();
    //Пробежим по всем частям пазла и проверим, есть ли какая-нибудь из них в дельта-окресности текущей картинки
    for (var i=0; i<puzzle.parts.length; i++){
      if (curPart.attr('id') == $(puzzle.parts[i]).attr('id')){
        continue;
      }
      var joinImages = puzzle.parts[i].children;
      for (var j=0; j<joinImages.length; j++){
        var curJoinImage = $(joinImages[j]);
        //Cначала проверим, возможно ли соединение двух данных элементов
        var joinPosition = isJoinable(curImg, curJoinImage);
        if (!joinPosition){
          continue;
        };

        if (!isJoinEnable(curImg, curJoinImage, joinPosition)){
          continue;
        }
        
        joinPart = puzzle.parts[i];
        return false;
      };
      if (joinPart){
        break;
      };
    };
  });
  return joinPart;
};

/**
 * Функция проверяет, собран ли весь пазл
 */
var isCompleted = function() {
  if (puzzle.parts.length === 1){
    return true;
  } else {
    return false;
  };
};

/**
 * Функция распологает картинки в блоке в нужном порядке
 */
var locateImages = function(curPart){
  var minCol;
  var minRow;
  var imgArray = [];
  var verticalOffset = puzzle.imgSize.height - puzzle.verticalOverlay*2;
  var horizontalOffset = puzzle.imgSize.width - puzzle.horizontalOverlay*2;
  //Положим каждую часть в массив, найдя при этом элементы с минимальными отступами
  $(curPart).children().each(function(key, img){
    var index = getImageIndex(img);
    var imgRow = getImageRow(index);
    var imgCol = getImageCol(index);
    imgArray.push({img: img, index: index, row: imgRow, col: imgCol});
    if (!minCol && minCol !== 0) {
      minCol = imgCol;
    } else if (imgCol < minCol){
      minCol = imgCol;
    };
    if (!minRow && minRow !== 0) {
      minRow = imgRow;
    } else if (imgRow < minRow){
      minRow = imgRow;
    };
  });
  //Установим для каждой картинки относительное смещение
  for (var i=0; i<imgArray.length; i++){
    var curImgObj = imgArray[i];
    var curImg = $(curImgObj.img);
    var curTop = (curImgObj.row - minRow)*verticalOffset;
    var curLeft = (curImgObj.col - minCol)*horizontalOffset;
    curImg.css('position', 'absolute');
    curImg.css('top', curTop);
    curImg.css('left', curLeft);
  };
};

/**
 * Функция объединяет curPart и joinPart в один блок
 */
var joinParts = function(curPart, joinPart){
  var obj1 = $(curPart);
  var obj2 = $(joinPart);
  var obj1Offset = obj1.offset();
  var obj2Offset = obj2.offset();
  var resultOffset = obj2Offset;
  // Определим положение по Y результирующего контейнера
  if (Math.abs(obj1Offset.top - obj2Offset.top) < puzzle.delta){
    resultOffset.top = obj2Offset.top;
  } else if (obj1Offset.top < obj2Offset.top) {
    resultOffset.top = obj1Offset.top;
  } else {
    resultOffset.top = obj2Offset.top;
  };
  // Определим положение по X результирующего контейнера
  if (Math.abs(obj1Offset.left - obj2Offset.left) < puzzle.delta){
    resultOffset.left = obj2Offset.left;
  } else if (obj1Offset.left < obj2Offset.left) {
    resultOffset.left = obj1Offset.left;
  } else {
    resultOffset.left = obj2Offset.left;
  };

  //Перенесем все части пазла из контейнера obj1 в контейнер obj2
  $(obj1.children()).each(function(key, curImg){
     var jqImage = $(curImg);
     jqImage.clone().appendTo(obj2);
     jqImage.remove();
  });
    
  //Найдем текущий obj1 в puzzle.parts и удалим его из массива и из DOM
  var i = 0;
  for (i=0; i<puzzle.parts.length; i++){
    curId = $(puzzle.parts[i]).attr('id');
    if (curId == obj1.attr('id')){
      puzzle.parts.splice(i, 1);
      obj1.remove();
      break;
    };
  }

  //Расположим части пазла в obj2 в нужном порядке 
  locateImages(obj2);

  // Правильно спозиционируем obj2
  obj2.offset(resultOffset);
};

/**
 * Обработчик события окончания перетаскивания объекта
 */
var onDraggingStop = function(e, obj){
  //Проверим, есть ли корректные соединения. Если есть - соединяем 
  var joinPart = hasCorrectJoin(obj.helper[0]);
  if (!joinPart) {
    return true;
  };

  joinParts(obj.helper[0], joinPart);

  if (isCompleted()){
    //TODO generate win-event
    alert("You're win!!!");
    return true;
  };
};

/**
 * Инициализатор пазла
 */
var init = function(){
  $('div.puzzle_img').each(function(key, curDiv){
    puzzle.parts.push(curDiv);
    var maxX    = 800;
    var minX    = 200;
    var maxY    = 600;
    var minY    = 0;
    var leftPos = Math.floor(Math.random()*(maxX-minX)+minX);
    var topPos  = Math.floor(Math.random()*(maxY-minY)+minY);
    $(curDiv).draggable({
      start : onDraggingStart,
      stop  : onDraggingStop
    });
    $(curDiv).css('left', leftPos);
    $(curDiv).css('top', topPos);
  });
};

$(document).ready(function(){
  init();
});
