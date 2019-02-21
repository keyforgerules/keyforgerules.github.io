function numstr(val) { return Math.round(val * 1000) / 1000.0; }

var ratings = {};
var info = {};

$.ajax({
  url: 'info.json'
}).done(function(data) {
  if (typeof(data) == "string")
    data = JSON.parse(data);
  info = data;
  renderInfo(info);
});

function renderInfo(info) {
  var $target = $('#info');
  var $li = $('<tr><td class="key"><td class="val"></td></tr>');
      $li.find('.key').text("Matches");
      $li.find('.val').text(info.matches);
      $li.appendTo($target);

    var $li = $('<tr><td class="key"><td class="val"></td></tr>');
      $li.find('.key').text("Last updated");
      $li.find('.val').text(info.date.substr(0, 10));
      $li.appendTo($target);

  var $target = $('#houseList tbody').empty();
  var num = 1;
  var list = info.houses;
  for (i in list) {
    var $li = $('<tr><td class="num"></td><td class="house"></td><td class="wins"></td><td class="winsa"></td><td class="losses"></td><td class="rating"></td><td class="awp"></td></tr>');
    $li.find('.num').text(num);
    $li.find('.house').text(list[i].Name);
    $li.find('.wins').text(list[i].Wins);
    $li.find('.winsa').text(numstr(list[i].WinsAdjusted));
    $li.find('.losses').text(list[i].Losses);
    $li.find('.rating').text(numstr(list[i].Rating * 100) + '%');
    $li.find('.awp').text(numstr((list[i].Rating - 0.5)*100));
    $li.appendTo($target);
    num++;
  }

  var $target = $('#comboList tbody').empty();
  var num = 1;
  var list = info.combos;
  for (i in list) {
    var $li = $('<tr><td class="num"></td><td class="house"></td><td class="wins"></td><td class="winsa"></td><td class="losses"></td><td class="rating"></td><td class="awp"></td></tr>');
    $li.find('.num').text(num);
    $li.find('.house').text(list[i].Name);
    $li.find('.wins').text(list[i].Wins);
    $li.find('.winsa').text(numstr(list[i].WinsAdjusted));
    $li.find('.losses').text(list[i].Losses);
    $li.find('.rating').text(numstr(list[i].Rating * 100) + '%');
    $li.find('.awp').text(numstr((list[i].Rating - 0.5)*100));
    $li.appendTo($target);
    num++;
  }
}

$.ajax({
  url: 'card_rating.json'
}).done(function(data) {
  if (typeof(data) == "string")
    data = JSON.parse(data);

  var cardDict = {};
  for (key in data) {
    cardDict[data[key].name] = data[key];
  }

  ratings = cardDict;
  renderTop(ratings);
});

$.ajax({
  url: 'top.json'
}).done(function(data) {
  if (typeof(data) == "string")
    data = JSON.parse(data);

  renderTopDecks('#topDecks', data.top);
  renderTopDecks('#avrgDecks', data.average);
  renderTopDecks('#botDecks', data.bottom);

  var $target = $('#info');
  var $li = $('<tr><td class="key"><td class="val"></td></tr>');
      $li.find('.key').text("Highest deck AWP score");
      $li.find('.val').text(numstr(data.top[0].Awp));
      $li.appendTo($target);

  var $target = $('#info');
  var $li = $('<tr><td class="key"><td class="val"></td></tr>');
      $li.find('.key').text("Median deck AWP score");
      $li.find('.val').text(numstr(data.average[0].Awp));
      $li.appendTo($target);

  var $target = $('#info');
  var $li = $('<tr><td class="key"><td class="val"></td></tr>');
      $li.find('.key').text("Lowest deck AWP score");
      $li.find('.val').text(numstr(data.bottom[0].Awp));
      $li.appendTo($target);
});

function renderTopDecks(div, list) {
  var $target = $(div + ' tbody').empty();
  var num = 1;
  for (i in list) {
    var $li = $('<tr><td class="num"></td><td class="name"></td><td class="awp"></td></tr>');
    $li.find('.num').text(num);
    $li.find('.name').html('<a href="https://keyforge-compendium.com/decks/'+list[i].Id+'">' + list[i].Name + "</a>");
    $li.find('.awp').text(numstr(list[i].Awp));
    $li.appendTo($target);
    num++;
  }
}

function renderTop(list) {
  var $target = $('#topList tbody').empty();
  var num = 1;
  for (i in list) {
    var $li = $('<tr><td class="num"></td><td class="name"></td><td class="house"></td><td class="wins"></td><td class="winsa"></td><td class="losses"></td><td class="rating"></td><td class="awp"></td></tr>');
    $li.find('.num').text(num);
    $li.find('.name').text(list[i].name);
    $li.find('.house').text(list[i].house);
    $li.find('.wins').text(list[i].Wins);
    $li.find('.winsa').text(numstr(list[i].WinsAdjusted));
    $li.find('.losses').text(list[i].Losses);
    $li.find('.rating').text(numstr(list[i].rating * 100)+ '%');
    $li.find('.awp').text(numstr(list[i].awp));
    $li.appendTo($target);
    num++;
  }
}

$('#getRating').on('click', function() {
  var $info = $('#infoList').empty();
  var $cards = $('#cardList tbody').empty();
  $('#loader').toggleClass('hidden', false);

  var name = $('#deckName').val().trim();

  var isGuid = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(name);;  
  if (isGuid) {

    var name = name.substr(length-36);
    var guid = 'https://www.keyforgegame.com/api/decks/'+ name +'/?links=cards';

    $.ajax({
       url: 'https://cors-anywhere.herokuapp.com/' + guid,
       crossDomain: true 
      }).done(function(data) { DisplayDeck(data.data, data._linked.cards); });
  } else {
    var search = 'https://www.keyforgegame.com/api/decks/?page=1&page_size=1&links=cards&search=' + name;

    $.ajax({ 
      url: 'https://cors-anywhere.herokuapp.com/' + search,
      crossDomain: true 
    }).done(function(data) { DisplayDeck(data.data[0], data._linked.cards); });
  }
});//.trigger('click');

function DisplayDeck(data, cards) {
  $('#loader').toggleClass('hidden', true);

  var cardDict = {};
  for (key in cards) {
    cardDict[cards[key].id] = cards[key];
  }

  var $info = $('#infoList').empty();
  var $li = $('<tr><th class="key"></th><th class="val"></th></tr>');
    $li.find('.key').text("Name");
    $li.find('.val').text(data.name);
    $li.appendTo($info);

  var $cards = $('#cardList tbody').empty();

  var sum = 0;
  var hsum = {};
  for (i in data._links.cards) {
    var id = data._links.cards[i];
    var card = cardDict[id];
    var rating = ratings[card.card_title].rating;
    var awp = ratings[card.card_title].awp;
    sum += rating;
    hsum[card.house] = (hsum[card.house] || 0) + rating;

    var $li = $('<tr><td class="name"></td><td class="house"></td><td class="rating"></td><td class="awp"></td></tr>');
      $li.find('.name').text(card.card_title);
      $li.find('.house').text(card.house);
      $li.find('.rating').text(numstr(rating * 100) + '%');
      $li.find('.awp').text(numstr(awp));
      $li.appendTo($cards);
  }

  var $li = $('<tr><th class="key"></th><th class="val"></th></tr>');
    $li.find('.key').text("Total AWP score");
    $li.find('.val').text(numstr(((sum / 36.0) - 0.5) * 100));
    $li.appendTo($info);
    
  var $li = $('<tr><td class="key"></td><td class="val"></td></tr>');
    $li.find('.key').text("Id");
    $li.find('.val').text(data.id);
    $li.appendTo($info);

  for (key in hsum) {
    var $li = $('<tr><td class="key"></td><td class="val"></td></tr>');
    $li.find('.key').text("AWP score for " + key);
    $li.find('.val').text(numstr(((hsum[key] / 12.0) - 0.5) * 100));
    $li.appendTo($info);
  }
}