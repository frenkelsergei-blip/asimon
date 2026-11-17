"use strict";

const clues = require("./who-cards");
const identities = Object.keys(clues);
const places = [3, 2, 1];
const turnMs = 60_000;

function deal(room, shuffle) {
  const previous = room.who;
  const deck = previous?.deck || [];
  if (deck.length < room.players.length) {
    const excluded = new Set([...deck, ...Object.values(previous?.cards || {})]);
    deck.push(...shuffle(identities.filter(identity => !excluded.has(identity))));
  }
  const cards = Object.fromEntries(room.players.map(player => [player.id, deck.shift()]));
  const seats = room.players.map(({ id, name, face }) => ({ id, name, face }));
  const first = room.round % seats.length;
  const order = seats.slice(first).concat(seats.slice(0, first));
  room.who = { cards, deck, usedHints: {}, order, index: 0, results: [], placements: [],
    places: Math.min(3, order.length - 1) };
  room.round++;
  room.phase = "who-ready";
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

function current(room) {
  return room.who.order[room.who.index];
}

function startTurn(room, now) {
  room.deadline = now + turnMs;
  room.phase = "who-active";
}

function finishTurn(room, now) {
  const seat = current(room);
  const elapsed = now < room.deadline ? Math.ceil(Math.max(0, now - (room.deadline - turnMs)) / 100) * 100 : null;
  room.who.results.push({ ...seat, elapsed, hinted: Boolean(room.who.usedHints[seat.id]) });
  room.deadline = null;
  room.phase = "who-turn-result";
}

function nextTurn(room) {
  const { order, results } = room.who;
  const index = order.findIndex((seat, i) => i > room.who.index && room.players.some(player => player.id === seat.id));
  room.deadline = null;
  if (index !== -1) {
    room.who.index = index;
    room.phase = "who-ready";
    return;
  }
  const ranked = results.filter(turn => turn.elapsed !== null)
    .sort((a, b) => a.elapsed - b.elapsed || Number(a.hinted) - Number(b.hinted));
  room.who.placements = ranked.map((turn, i) => {
    const place = i + 1;
    const base = place <= room.who.places ? places[place - 1] : 0;
    const points = Math.max(0, base - Number(turn.hinted));
    const player = room.players.find(candidate => candidate.id === turn.id);
    if (player) player.score += points;
    return { ...turn, place, points };
  });
  room.phase = "who-reveal";
}

function view(room, player) {
  if (!room.who) return {};
  const { cards, usedHints, order, index, results, placements, places } = room.who;
  if (room.phase === "who-reveal") {
    return { places, placements: placements.map(row => player ? { ...row, identity: cards[row.id] } : row),
      missed: results.filter(turn => turn.elapsed === null) };
  }
  const seat = current(room);
  const result = { turn: { ...seat, number: index + 1, total: order.length } };
  if (room.phase === "who-turn-result") {
    result.turn.elapsed = results.at(-1).elapsed;
    result.turn.hasNext = order.slice(index + 1).some(next => room.players.some(member => member.id === next.id));
    if (player) result.turn.identity = cards[seat.id];
  }
  if (room.phase === "who-active" && player) {
    if (player.id === seat.id) result.hint = usedHints[seat.id] ?? null;
    else result.turn.identity = cards[seat.id];
  }
  return result;
}

module.exports = { deal, current, startTurn, useHint, finishTurn, nextTurn, view };
