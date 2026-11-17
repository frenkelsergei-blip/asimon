"use strict";

const clues = require("./who-cards");
const identities = Object.keys(clues);
const places = [3, 2, 1];

function deal(room, shuffle) {
  const previous = room.who;
  const deck = previous?.deck || [];
  if (deck.length < room.players.length) {
    const excluded = new Set([...deck, ...Object.values(previous?.cards || {})]);
    deck.push(...shuffle(identities.filter(identity => !excluded.has(identity))));
  }
  const cards = Object.fromEntries(room.players.map(player => [player.id, deck.shift()]));
  room.who = { cards, deck, usedHints: {}, placements: [], places: Math.min(3, room.players.length - 1) };
  room.round++;
  room.phase = "who-active";
}

function useHint(room, player, shuffle) {
  const { cards, usedHints } = room.who;
  if (usedHints[player.id]) return;
  const identity = cards[player.id];
  room.whoHintOrder ||= {};
  const order = room.whoHintOrder[identity] ||= shuffle(clues[identity]);
  const hint = order.shift();
  order.push(hint);
  usedHints[player.id] = hint;
}

function isPlaced(room, player) {
  return room.who.placements.some(placement => placement.id === player.id);
}

function place(room, player) {
  const { cards, usedHints, placements } = room.who;
  if (player) {
    const { id, name, face } = player;
    const hinted = !!usedHints[id];
    const number = placements.length + 1;
    const points = Math.max(0, places[number - 1] - Number(hinted));
    placements.push({ id, name, face, identity: cards[id], place: number, points, hinted });
    player.score += points;
  }
  if (!player || placements.length === room.who.places) room.phase = "who-reveal";
}

function afterLeave(room) {
  const unsolved = room.players.filter(player => !isPlaced(room, player)).length;
  const placed = room.who.placements.length;
  room.who.places = Math.min(room.who.places, placed + Math.max(0, unsolved - 1));
  if (placed >= room.who.places) room.phase = "who-reveal";
}

function view(room, player) {
  if (!room.who) return {};
  const { cards, usedHints, placements, places } = room.who;
  const active = room.phase === "who-active";
  const result = {
    places,
    placements: placements.map(({ identity, ...row }) => active || !player ? row : { ...row, identity })
  };
  if (active && player) {
    result.cards = Object.fromEntries(room.players.filter(other => other !== player).map(other => [other.id, cards[other.id]]));
    result.hint = usedHints[player.id] ?? null;
  }
  return result;
}

module.exports = { deal, isPlaced, useHint, place, afterLeave, view };
