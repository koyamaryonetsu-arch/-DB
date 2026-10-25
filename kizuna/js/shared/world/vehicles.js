// 乗り物屋と「乗り物」の メニュー（サーバー。きまりは data/vehicles.js）
import { VEHICLE_SHOP, vehicleShelf, ownedVehicles, chosenVehicle, buyVehicle, chooseVehicle, cleanVehicles } from '../data/vehicles.js?v=6f0cf3958911';

// 店に 入った とき（ui に わたす）
export function vehicleShopInfo(world, s) {
  const c = s.char;
  if (!c || c.species) return null;
  cleanVehicles(c);
  s.openVehicleShop = true;
  return { name: VEHICLE_SHOP.name, keeper: VEHICLE_SHOP.keeper, hello: VEHICLE_SHOP.hello, shelf: vehicleShelf(c), owned: ownedVehicles(c), chosen: chosenVehicle(c) };
}

// 店で 買う（reply(ok, text, extra)）。買ったら すぐ 乗るか（msg.ride）
export function vehicleShopAction(world, s, msg, reply) {
  const c = s.char;
  if (!c || c.species || !s.openVehicleShop) return reply(false, '');
  const extra = () => ({ shelf: vehicleShelf(c), owned: ownedVehicles(c), chosen: chosenVehicle(c) });
  // 持っている 物に 乗る（買った あとの「さっそく 乗る？」）
  if (msg.action === 'ride') {
    const r = chooseVehicle(c, msg.id ?? null);
    return reply(r.ok, r.text, extra());
  }
  if (msg.action !== 'buy') return reply(false, '');
  const r = buyVehicle(c, String(msg.id || ''));
  if (r.ok && msg.ride) chooseVehicle(c, msg.id);
  return reply(r.ok, r.text, extra());
}

// メニューの「乗り物」: えらぶ・乗らない（id: null）
export function vehicleMenuAction(world, s, msg) {
  const c = s.char;
  if (!c || c.species) return { ok: false, text: '' };
  return chooseVehicle(c, msg.id ?? null);
}

// いちの じょうほう（snap）に のせる 乗り物: 走っている（動いている）時だけ。大鳥・竜で とんでいる 時は のせない
export function vehicleSnap(p) {
  if (!p?.moving || !p.running || p.flying || p.busy) return null;
  return chosenVehicle(p.char);
}
