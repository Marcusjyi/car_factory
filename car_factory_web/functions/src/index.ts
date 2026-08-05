/**
 * Cloud Functions entry
 * - Product listing number (CF-YYMMDD-NNNNN)
 * - Chat rooms (getOrCreate / markRead / onMessageCreated)
 * - Direct trade (reserve / cancel / complete / transfer info)
 *
 * Social auth callbacks live in auth/social.ts and are deployed separately
 * when KAKAO/NAVER secrets are configured.
 */

import {setGlobalOptions} from "firebase-functions/v2";

setGlobalOptions({maxInstances: 10, region: "asia-northeast3"});

export {onProductCreatedAssignListingNumber} from "./products/listing-number.js";

export {
  getOrCreateChatRoom,
  markChatRoomRead,
  onMessageCreated,
} from "./chat/chat-rooms.js";

export {
  createDirectTrade,
  cancelDirectTrade,
  completeDirectTrade,
  setTradeTransferInfo,
  hideDirectTradeFromHistory,
} from "./trades/direct-trade.js";

export {
  seedInitialAdmin,
  createAdminUser,
  listAdmins,
  setAdminRole,
  revokeAdminAccess,
} from "./admin/set-role.js";
