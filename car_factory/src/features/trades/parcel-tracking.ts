import type { TradeShippingInfo } from "@/types/trade";

/** 택배사별 운송장 조회 URL */
export function getParcelTrackingUrl(
  shipping: Pick<TradeShippingInfo, "carrier" | "trackingNumber"> | null | undefined,
): string | null {
  if (!shipping?.carrier || !shipping.trackingNumber) return null;
  const invoice = encodeURIComponent(shipping.trackingNumber.trim());
  const carrier = shipping.carrier.trim();

  switch (carrier) {
    case "CJ대한통운":
      return `https://trace.cjlogistics.com/next/tracking.html?wblNo=${invoice}`;
    case "한진택배":
      return `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText2=${invoice}`;
    case "롯데택배":
      return `https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo=${invoice}`;
    case "우체국택배":
      return `https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?displayHeader=N&sid1=${invoice}`;
    case "로젠택배":
      return `https://www.ilogen.com/m/personal/trace.pop/${invoice}`;
    case "경동택배":
      return `https://kdexp.com/service/delivery/delivery.do?barcode=${invoice}`;
    case "대신택배":
      return `https://www.ds3211.co.kr/freight/internalFreightSearch.ht?billno=${invoice}`;
    case "CU편의점택배":
      return `https://www.cupost.co.kr/postbox/delivery/localResult.cupost?invoice_no=${invoice}`;
    case "GS Postbox":
      return `https://www.cvsnet.co.kr/invoice/tracking.do?invoice_no=${invoice}`;
    default:
      // 기타·미매핑: 스마트택배 통합조회 검색으로 유도
      return `https://search.naver.com/search.naver?query=${encodeURIComponent(
        `${carrier} ${shipping.trackingNumber} 배송조회`,
      )}`;
  }
}
