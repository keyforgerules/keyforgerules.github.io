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

function AddLine(data, $target) {
  var $row = $('<tr></tr>');
  for (key in data) {
    var $col = $('<td></td>').html(data[key]);
    $col.appendTo($row);
  }
  $row.appendTo($target);
}

function renderInfo(info) {
  var $target = $('#info');
  AddLine(["Matches", info.matches], $target);
  AddLine(["Decks", info.decks], $target);
  AddLine(["Last updated", info.date.substr(0, 10)], $target);

  var $target = $('#houseList tbody').empty();
  var num = 1;
  var list = info.houses;
  for (i in list) {
    AddLine([
      num, list[i].Name, list[i].Wins, numstr(list[i].WinsAdjusted), list[i].Losses,  numstr(list[i].Rating * 100) + '%', numstr((list[i].Rating - 0.5)*100)
    ], $target);
    num++;
  }

  var $target = $('#comboList tbody').empty();
  var num = 1;
  var list = info.combos;
  for (i in list) {
    AddLine([
      num, list[i].Name, list[i].Wins, numstr(list[i].WinsAdjusted), list[i].Losses, numstr(list[i].Rating * 100) + '%', numstr((list[i].Rating - 0.5)*100)
    ], $target);
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
    cardDict[data[key].Name] = data[key];
  }
  ratings = cardDict;

  renderTop(data);
});

function renderTop(list) {
  var $target = $('#topList tbody').empty();
  var num = 1;
  for (i in list) {
    AddLine([
      num, list[i].Name, list[i].House, list[i].Wins, numstr(list[i].WinsAdjusted), list[i].Losses,
       numstr(list[i].Rating * 100)+ '%', numstr(list[i].Awp)
    ], $target);
    num++;
  }
}

$.ajax({
  url: 'top.json'
}).done(function(data) {
  if (typeof(data) == "string")
    data = JSON.parse(data);

  renderTopDecks('#topDecks', data.Top);
  renderTopDecks('#avrgDecks', data.Average);
  renderTopDecks('#botDecks', data.Bottom);

  var $target = $('#info');
  AddLine(["Highest deck AWP score", numstr(data.Top[0].Awp)], $target);
  AddLine(["Median deck AWP score", numstr(data.Average[0].Awp)], $target);
  AddLine(["Lowest deck AWP score", numstr(data.Bottom[0].Awp)], $target);
});

function renderTopDecks(div, list) {
  var $target = $(div + ' tbody').empty();
  var num = 1;
  for (i in list) {
    AddLine([num, '<a href="https://www.keyforgegame.com/deck-details/'+list[i].Id+'">' + list[i].Name + "</a>", numstr(list[i].Awp)], $target);
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
  AddLine(["Name", data.name], $info);

  var $cards = $('#cardList tbody').empty();

  var sum = 0;
  var hsum = {};
  for (i in data._links.cards) {
    var id = data._links.cards[i];
    var card = cardDict[id];
    var rating = ratings[card.card_title].Rating;
    var awp = ratings[card.card_title].Awp;
    sum += rating;
    hsum[card.house] = (hsum[card.house] || 0) + rating;

    AddLine([card.card_title, card.house, numstr(rating * 100) + '%', numstr(awp)], $cards);
  }

  AddLine(["Total AWP score", numstr(((sum / 36.0) - 0.5) * 100)], $info);
  AddLine(["Id", data.id], $info);

  for (key in hsum) {
    AddLine(["AWP score for " + key, numstr(((hsum[key] / 12.0) - 0.5) * 100)], $info);
  }
}