import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type Seed = {
  slug: string
  name: string
  category:
    | 'construction'
    | 'business'
    | 'commercial'
    | 'tax'
    | 'welfare'
    | 'general'
  description: string
  requiredDocs: { key: string; label: string; required: boolean }[]
}

// Slugs to remove (deprecated / superseded / overlapping)
const DEPRECATED_SLUGS = [
  // ขอใช้ไฟฟ้า ทับซ้อนกับ "ขอหนังสือรับรองสิ่งปลูกสร้าง" — ใช้รายการหลังแทน
  'electricity-request',
]

const COMMON_DOCS = [
  { key: 'request_form', label: 'ใบคำขอ/แบบฟอร์มที่กรอกแล้ว', required: true },
  { key: 'id_card', label: 'สำเนาบัตรประจำตัวประชาชนของผู้ยื่นคำขอ', required: true },
  { key: 'house_reg', label: 'สำเนาทะเบียนบ้านของผู้ยื่นคำขอ', required: true },
  { key: 'land_or_lease', label: 'สำเนาโฉนดที่ดิน/น.ส.3 หรือหนังสือสัญญาเช่า', required: true },
  { key: 'consent_letter', label: 'หนังสือยินยอมให้ใช้สถานที่ (กรณีเช่า)', required: false },
  {
    key: 'landowner_consent',
    label: 'หนังสือยินยอมจากเจ้าของที่ดิน (กรณีที่ดินไม่ใช่ของผู้ขอ)',
    required: false,
  },
  {
    key: 'power_of_attorney',
    label: 'หนังสือมอบอำนาจ พร้อมติดอากรแสตมป์ 10 บาท (กรณีไม่ได้มาเอง)',
    required: false,
  },
  {
    key: 'attorney_id_house',
    label: 'สำเนาบัตรประชาชน/ทะเบียนบ้าน ของผู้มอบและผู้รับมอบอำนาจ (กรณีมอบอำนาจ)',
    required: false,
  },
  {
    key: 'corp_certificate',
    label: 'หนังสือรับรองการจดทะเบียนบริษัท/หจก. (ไม่เกิน 6 เดือน) — กรณีนิติบุคคล',
    required: false,
  },
  {
    key: 'signing_authority',
    label: 'หลักฐานแสดงอำนาจลงนามแทนนิติบุคคล — กรณีนิติบุคคล',
    required: false,
  },
]

const ID_DOCS = [
  { key: 'request_form', label: 'แบบฟอร์มที่กรอกแล้ว', required: true },
  { key: 'id_card', label: 'สำเนาบัตรประจำตัวประชาชนของผู้ยื่นคำขอ', required: true },
  { key: 'house_reg', label: 'สำเนาทะเบียนบ้านของผู้ยื่นคำขอ', required: true },
]

const seeds: Seed[] = [
  // ───── กองช่าง ─────
  {
    slug: 'water-supply',
    name: 'แบบฟอร์มขอใช้น้ำประปา',
    category: 'construction',
    description: 'กองช่าง — คำร้องขอติดตั้ง/ใช้บริการน้ำประปาในเขต อบต.',
    requiredDocs: [...COMMON_DOCS],
  },
  {
    slug: 'building-permit',
    name: 'แบบฟอร์มคำขออนุญาตก่อสร้างอาคาร (ข.1)',
    category: 'construction',
    description:
      'กองช่าง — สำหรับการก่อสร้าง ดัดแปลง หรือรื้อถอนอาคาร เมื่ออนุมัติจะออกใบอนุญาต อ.1',
    requiredDocs: [
      ...COMMON_DOCS,
      { key: 'blueprint', label: 'แบบแปลนการก่อสร้าง', required: true },
      { key: 'structure_calc', label: 'รายการคำนวณโครงสร้าง (ถ้ามี)', required: false },
      { key: 'engineer_cert', label: 'หนังสือรับรองวิศวกร/สถาปนิก', required: false },
    ],
  },
  {
    slug: 'land-excavation-permit',
    name: 'แบบฟอร์มคำขออนุญาตขุดดินและถมดิน (ขถด.1)',
    category: 'construction',
    description:
      'กองช่าง — กรณีมีการขุดดินหรือถมดินในพื้นที่ที่อาจกระทบต่อทางสาธารณะหรือความปลอดภัยของพื้นที่ข้างเคียง',
    requiredDocs: [
      ...COMMON_DOCS,
      { key: 'excavation_plan', label: 'แผนผังบริเวณ/แบบแปลนการขุดหรือถมดิน', required: true },
      { key: 'excavation_calc', label: 'รายการคำนวณความลึก/ความสูง/ความลาดเอียง', required: true },
      { key: 'engineer_cert', label: 'หนังสือรับรองวิศวกรผู้ออกแบบ/ควบคุมงาน', required: true },
      { key: 'site_photo', label: 'รูปถ่ายบริเวณก่อนดำเนินการ', required: true },
      { key: 'neighbor_consent', label: 'หนังสือยินยอมเจ้าของที่ดินข้างเคียง (ถ้าจำเป็น)', required: false },
    ],
  },
  {
    slug: 'building-certificate',
    name: 'แบบฟอร์มคำขอหนังสือรับรองสิ่งปลูกสร้าง/ต่อเติม',
    category: 'construction',
    description:
      'กองช่าง — หนังสือรับรองสิ่งปลูกสร้างหรืออาคารต่อเติมจาก อบต. ใช้ประกอบการขอเลขที่บ้าน ขอใช้ไฟฟ้า/น้ำประปา หรืออื่น ๆ ตามที่ราชการกำหนด',
    requiredDocs: [
      ...COMMON_DOCS,
      { key: 'building_photo', label: 'รูปถ่ายอาคาร/สิ่งปลูกสร้าง/ส่วนต่อเติม', required: true },
      { key: 'location_map', label: 'แผนที่ตั้งสิ่งปลูกสร้าง', required: true },
      {
        key: 'extension_blueprint',
        label: 'แบบแปลน/ภาพถ่ายส่วนต่อเติม (กรณีต่อเติม)',
        required: false,
      },
      { key: 'building_permit_copy', label: 'สำเนาใบอนุญาตก่อสร้าง (อ.1) ถ้ามี', required: false },
    ],
  },
  {
    slug: 'public-electric-broken',
    name: 'แบบฟอร์มแจ้งไฟฟ้าสาธารณะชำรุด',
    category: 'construction',
    description: 'กองช่าง — แจ้งให้ อบต. ดำเนินการซ่อมไฟฟ้าสาธารณะ (ไฟกิ่ง/ไฟถนน) ที่ชำรุด',
    requiredDocs: [
      ...ID_DOCS,
      { key: 'broken_photo', label: 'รูปถ่ายจุดที่ชำรุด', required: true },
      { key: 'location_map', label: 'แผนที่/พิกัดจุดที่ชำรุด', required: true },
    ],
  },
  {
    slug: 'village-water-broken',
    name: 'แบบฟอร์มแจ้งประปาหมู่บ้านชำรุด',
    category: 'construction',
    description: 'กองช่าง — แจ้งให้ อบต. ดำเนินการซ่อมระบบประปาหมู่บ้านที่ชำรุด',
    requiredDocs: [
      ...ID_DOCS,
      { key: 'broken_photo', label: 'รูปถ่ายจุดที่ชำรุด', required: true },
      { key: 'location_map', label: 'แผนที่/พิกัดจุดที่ชำรุด', required: true },
    ],
  },

  // ───── กองคลัง — ใบอนุญาตประกอบกิจการ ─────
  {
    slug: 'health-hazard-business',
    name: 'แบบฟอร์มคำขอรับใบอนุญาตประกอบกิจการที่เป็นอันตรายต่อสุขภาพ (อภ.1)',
    category: 'business',
    description:
      'กองคลัง — เช่น ร้านซ่อมรถ ร้านนวด โรงงาน สถานที่เลี้ยงสัตว์ หรือกิจการที่เกิดฝุ่น/กลิ่น/เสียง — เมื่ออนุมัติจะออกใบอนุญาต อภ.3',
    requiredDocs: [
      ...COMMON_DOCS,
      { key: 'shop_photo', label: 'รูปถ่ายสถานประกอบการ', required: true },
      { key: 'location_plan', label: 'แผนผังแสดงสถานที่ประกอบกิจการ', required: true },
      { key: 'sanitary_report', label: 'รายงานการตรวจสุขลักษณะ (ถ้ามี)', required: false },
    ],
  },
  {
    slug: 'health-hazard-renewal',
    name: 'แบบฟอร์มคำขอต่อใบอนุญาตประกอบกิจการที่เป็นอันตรายต่อสุขภาพ (อภ.2)',
    category: 'business',
    description: 'กองคลัง — แบบคำขอต่ออายุใบอนุญาต ก่อนวันที่ใบอนุญาต อภ.3 หมดอายุ',
    requiredDocs: [
      ...ID_DOCS,
      { key: 'previous_license', label: 'สำเนาใบอนุญาตเดิม (อภ.3)', required: true },
      { key: 'shop_photo', label: 'รูปถ่ายสถานประกอบการปัจจุบัน', required: true },
      { key: 'sanitary_report', label: 'รายงานการตรวจสุขลักษณะ (ถ้ามี)', required: false },
    ],
  },
  {
    slug: 'health-hazard-replacement',
    name: 'แบบฟอร์มคำขอใบแทนใบอนุญาตประกอบกิจการที่เป็นอันตรายต่อสุขภาพ (อภ.6)',
    category: 'business',
    description:
      'กองคลัง — คำขอออกใบแทนใบอนุญาต กรณีใบอนุญาตเดิม (อภ.3) สูญหาย ชำรุด หรือถูกทำลาย',
    requiredDocs: [
      ...ID_DOCS,
      {
        key: 'lost_report',
        label: 'ใบแจ้งความ/บันทึกประจำวัน (กรณีสูญหาย)',
        required: false,
      },
      {
        key: 'damaged_license',
        label: 'ใบอนุญาตเดิม อภ.3 ที่ชำรุด (กรณีชำรุด)',
        required: false,
      },
      { key: 'shop_photo', label: 'รูปถ่ายสถานประกอบการปัจจุบัน', required: true },
    ],
  },
  {
    slug: 'food-shop-license',
    name: 'แบบฟอร์มใบอนุญาตจำหน่ายอาหารหรือสะสมอาหาร (ส.อ.1)',
    category: 'business',
    description: 'กองคลัง — สำหรับร้านอาหารและร้านค้าทั่วไปที่จำหน่ายอาหาร',
    requiredDocs: [
      ...COMMON_DOCS,
      { key: 'shop_photo', label: 'รูปถ่ายร้าน', required: true },
      { key: 'location_plan', label: 'แผนผังแสดงสถานที่ประกอบกิจการ', required: true },
      { key: 'sanitary_report', label: 'รายงานการตรวจสุขลักษณะ (ถ้ามี)', required: false },
      { key: 'health_cert', label: 'ใบรับรองสุขภาพผู้ประกอบการ', required: false },
    ],
  },
  {
    slug: 'street-vendor-license',
    name: 'แบบฟอร์มใบอนุญาตจำหน่ายสินค้าในที่หรือทางสาธารณะ (สณ.1)',
    category: 'business',
    description: 'กองคลัง — สำหรับตั้งร้านค้าบนฟุตบาทหรือข้างทาง',
    requiredDocs: [
      ...COMMON_DOCS,
      { key: 'shop_photo', label: 'รูปถ่ายแผงค้า/อุปกรณ์', required: true },
      { key: 'location_map', label: 'แผนที่จุดที่จะตั้งร้าน', required: true },
    ],
  },
  {
    slug: 'signage-permit',
    name: 'แบบฟอร์มใบอนุญาตติดตั้งป้ายโฆษณา',
    category: 'business',
    description: 'กองคลัง — สำหรับการติดตั้งป้ายโฆษณาในพื้นที่เอกชนที่มองเห็นได้จากทางสาธารณะ',
    requiredDocs: [
      ...COMMON_DOCS,
      { key: 'sign_design', label: 'แบบป้าย/รูปแบบโฆษณา (ระบุขนาดและข้อความ)', required: true },
      { key: 'sign_location', label: 'แผนผังจุดติดตั้งป้าย', required: true },
      { key: 'sign_photo', label: 'รูปถ่ายบริเวณที่จะติดตั้ง', required: true },
      { key: 'engineer_cert', label: 'หนังสือรับรองวิศวกร (กรณีป้ายขนาดใหญ่/โครงสร้าง)', required: false },
    ],
  },
  {
    slug: 'sound-permit',
    name: 'แบบฟอร์มขออนุญาตใช้เครื่องขยายเสียงเพื่อโฆษณา (ม.5)',
    category: 'business',
    description: 'กองคลัง — สำหรับใช้เครื่องขยายเสียง รถแห่ ลำโพง เพื่อการโฆษณาในที่สาธารณะ',
    requiredDocs: [
      ...ID_DOCS,
      { key: 'sound_detail', label: 'รายละเอียดการใช้เสียง (วัน เวลา สถานที่ ระยะเวลา)', required: true },
      { key: 'ad_message', label: 'ข้อความหรือบทพูดที่จะกระจายเสียง', required: true },
      { key: 'sound_route_map', label: 'แผนที่/เส้นทางบริเวณที่ใช้เสียง', required: true },
      { key: 'vehicle_doc', label: 'สำเนาทะเบียนรถ (กรณีใช้รถแห่/รถกระจายเสียง)', required: false },
    ],
  },
  {
    slug: 'slaughter-notification',
    name: 'แบบฟอร์มแจ้งการฆ่าสัตว์ (ฆจส.1)',
    category: 'business',
    description:
      'กองคลัง — แบบแจ้งการฆ่าสัตว์เพื่อจำหน่ายเนื้อในเขต อบต. ตาม พ.ร.บ. ควบคุมการฆ่าสัตว์เพื่อการจำหน่ายเนื้อสัตว์',
    requiredDocs: [
      ...ID_DOCS,
      { key: 'animal_detail', label: 'รายละเอียดสัตว์ที่จะฆ่า (ชนิด จำนวน วันเวลา สถานที่)', required: true },
      { key: 'slaughterhouse_doc', label: 'หลักฐานสถานที่/โรงฆ่าสัตว์', required: true },
      { key: 'animal_health_cert', label: 'ใบรับรองสุขภาพสัตว์ (ถ้ามี)', required: false },
    ],
  },

  // ───── กองคลัง — จดทะเบียนพาณิชย์ ─────
  {
    slug: 'commercial-registration',
    name: 'แบบฟอร์มคำขอจดทะเบียนพาณิชย์ (ทพ.)',
    category: 'commercial',
    description: 'กองคลัง — สำหรับร้านค้าทั่วไป ทั้งบุคคลธรรมดาและนิติบุคคลในเขต อบต.',
    requiredDocs: [
      ...COMMON_DOCS,
      { key: 'business_house_reg', label: 'สำเนาทะเบียนบ้านที่ตั้งสถานประกอบการ', required: true },
      { key: 'shop_photo', label: 'รูปถ่ายร้านค้า', required: true },
      { key: 'location_map', label: 'แผนที่แสดงที่ตั้งร้าน', required: true },
    ],
  },
  {
    slug: 'commercial-registration-e',
    name: 'แบบฟอร์มคำขอจดทะเบียนพาณิชย์อิเล็กทรอนิกส์ (ทพ.)',
    category: 'commercial',
    description: 'กองคลัง — สำหรับผู้ประกอบธุรกิจขายสินค้า/บริการผ่านอินเทอร์เน็ต',
    requiredDocs: [
      ...COMMON_DOCS,
      { key: 'website_or_platform', label: 'รายละเอียดเว็บไซต์/แพลตฟอร์ม/ช่องทางจำหน่ายออนไลน์', required: true },
      { key: 'website_screenshot', label: 'ภาพหน้าเว็บไซต์/หน้าร้านออนไลน์', required: true },
      { key: 'domain_evidence', label: 'หลักฐานการจดโดเมน (ถ้ามี)', required: false },
    ],
  },

  // ───── กองคลัง — ภาษี ─────
  {
    slug: 'tax-land-building',
    name: 'แบบฟอร์มแจ้งรายการเพื่อเสียภาษีที่ดินและสิ่งปลูกสร้าง (ภ.ด.ส.7)',
    category: 'tax',
    description:
      'กองคลัง — แบบแจ้งรายการเพื่อเสียภาษีที่ดินและสิ่งปลูกสร้างประจำปี ใช้แจ้งข้อมูลและคำนวณภาษีตาม พ.ร.บ. ภาษีที่ดินและสิ่งปลูกสร้าง พ.ศ. 2562',
    requiredDocs: [
      ...ID_DOCS,
      { key: 'land_doc', label: 'สำเนาเอกสารสิทธิ์ที่ดิน (โฉนด/น.ส.3/น.ส.3 ก)', required: true },
      { key: 'building_photo', label: 'รูปถ่ายโรงเรือน/สิ่งปลูกสร้าง', required: false },
      { key: 'previous_tax_receipt', label: 'สำเนาใบเสร็จภาษีปีก่อน (ถ้ามี)', required: false },
    ],
  },
  {
    slug: 'tax-house-land-rd2',
    name: 'แบบฟอร์มแจ้งรายการเพื่อเสียภาษีโรงเรือนและที่ดิน (ภ.ร.ด.2)',
    category: 'tax',
    description:
      'กองคลัง — แบบ ภ.ร.ด.2 สำหรับแจ้งรายการเสียภาษีโรงเรือนและที่ดิน (กฎหมายเดิมก่อน พ.ร.บ. ภาษีที่ดินฯ 2562)',
    requiredDocs: [
      ...ID_DOCS,
      { key: 'land_doc', label: 'สำเนาเอกสารสิทธิ์ที่ดิน (โฉนด/น.ส.3)', required: true },
      { key: 'building_photo', label: 'รูปถ่ายโรงเรือน/อาคาร', required: true },
      { key: 'rental_contract', label: 'สำเนาสัญญาเช่า (กรณีให้เช่า)', required: false },
      { key: 'previous_tax_receipt', label: 'สำเนาใบเสร็จภาษีปีก่อน (ถ้ามี)', required: false },
    ],
  },
  {
    slug: 'tax-land-survey',
    name: 'แบบฟอร์มสำรวจข้อมูลที่ดิน สิ่งปลูกสร้าง และอาคารชุด (ภ.ด.ส.1-8)',
    category: 'tax',
    description:
      'กองคลัง — แบบ ภ.ด.ส.1 ถึง ภ.ด.ส.8 ใช้สำรวจและบันทึกข้อมูลที่ดิน/สิ่งปลูกสร้าง/ห้องชุด เพื่อใช้ประเมินภาษีที่ดินและสิ่งปลูกสร้าง',
    requiredDocs: [
      ...ID_DOCS,
      { key: 'land_doc', label: 'สำเนาเอกสารสิทธิ์ที่ดิน (โฉนด/น.ส.3/น.ส.3 ก)', required: true },
      { key: 'condo_title', label: 'สำเนาหนังสือกรรมสิทธิ์ห้องชุด (กรณีอาคารชุด)', required: false },
      { key: 'building_photo', label: 'รูปถ่ายสิ่งปลูกสร้าง', required: false },
      { key: 'land_map', label: 'แผนที่/แผนผังที่ดิน', required: false },
    ],
  },
  {
    slug: 'tax-land-area-reduction',
    name: 'แบบฟอร์มแสดงรายการขอลดเนื้อที่ดิน (ภ.บ.ท.5)',
    category: 'tax',
    description:
      'กองคลัง — แบบแสดงรายการขอลดเนื้อที่ดินสำหรับภาษีบำรุงท้องที่ (ภ.บ.ท.5) กรณีที่ดินถูกเวนคืน เปลี่ยนสภาพ หรือมีการแบ่งแยก',
    requiredDocs: [
      ...ID_DOCS,
      { key: 'land_doc', label: 'สำเนาโฉนดที่ดิน/น.ส.3 ก่อนและหลังแบ่งแยก', required: true },
      { key: 'land_map_diff', label: 'แผนที่/แผนผังแสดงเนื้อที่ดินที่ขอลด', required: true },
      {
        key: 'expropriation_doc',
        label: 'หลักฐานการถูกเวนคืน/เปลี่ยนสภาพ (ถ้ามี)',
        required: false,
      },
      { key: 'previous_tax_receipt', label: 'สำเนาใบเสร็จภาษีปีก่อน (ถ้ามี)', required: false },
    ],
  },
  {
    slug: 'tax-correction',
    name: 'แบบฟอร์มคำร้องแก้ไขบัญชีที่ดินและสิ่งปลูกสร้าง',
    category: 'tax',
    description:
      'กองคลัง — สำหรับแจ้งแก้ไขข้อมูลในบัญชีรายการที่ดินและสิ่งปลูกสร้าง เช่น เนื้อที่ ขนาด ลักษณะการใช้ประโยชน์ที่ไม่ถูกต้อง',
    requiredDocs: [
      ...ID_DOCS,
      {
        key: 'tax_assessment',
        label: 'สำเนาบัญชีที่ดินและสิ่งปลูกสร้าง/หนังสือแจ้งประเมินที่ต้องการแก้ไข',
        required: true,
      },
      { key: 'land_doc', label: 'สำเนาเอกสารสิทธิ์ที่ดิน', required: true },
      {
        key: 'correction_evidence',
        label: 'หลักฐานยืนยันข้อมูลที่ถูกต้อง (รูปถ่าย/แผนผัง/เอกสารอื่น)',
        required: true,
      },
    ],
  },
  {
    slug: 'tax-signage',
    name: 'แบบฟอร์มแสดงรายการภาษีป้าย (ภ.ป.1)',
    category: 'tax',
    description:
      'กองคลัง — แบบแสดงรายการภาษีป้ายประจำปี สำหรับผู้ติดตั้งป้ายโฆษณาในเขต อบต. ยื่นภายใน 31 มีนาคม ของทุกปี',
    requiredDocs: [
      ...ID_DOCS,
      { key: 'corp_certificate', label: 'หนังสือรับรองนิติบุคคล (กรณีนิติบุคคล)', required: false },
      { key: 'sign_photo', label: 'รูปถ่ายป้ายที่จะเสียภาษี', required: true },
      { key: 'sign_dimension', label: 'รายละเอียดขนาด/จำนวนป้าย', required: true },
      { key: 'sign_location', label: 'แผนที่ตั้งป้าย', required: true },
      { key: 'previous_tax_receipt', label: 'สำเนาใบเสร็จภาษีปีก่อน (ถ้ามี)', required: false },
    ],
  },
  {
    slug: 'tax-installment',
    name: 'แบบฟอร์มขอผ่อนชำระภาษีที่ดินและสิ่งปลูกสร้าง',
    category: 'tax',
    description: 'กองคลัง — สำหรับผู้เสียภาษีที่ประสงค์จะขอผ่อนชำระภาษีที่ดินและสิ่งปลูกสร้าง/ห้องชุด',
    requiredDocs: [
      ...ID_DOCS,
      { key: 'tax_assessment', label: 'หนังสือแจ้งประเมินภาษี', required: true },
      { key: 'income_evidence', label: 'หลักฐานแสดงเหตุผลการขอผ่อนชำระ (ถ้ามี)', required: false },
    ],
  },

  // ───── กองคลัง — พัสดุ ─────
  {
    slug: 'borrow-equipment',
    name: 'แบบฟอร์มขอยืมพัสดุ-ครุภัณฑ์',
    category: 'general',
    description: 'กองคลัง — สำหรับขอยืมพัสดุหรือครุภัณฑ์ของ อบต. เช่น เต็นท์ โต๊ะ เก้าอี้ เครื่องเสียง',
    requiredDocs: [
      { key: 'request_form', label: 'แบบฟอร์มขอยืมที่กรอกแล้ว', required: true },
      { key: 'id_card', label: 'สำเนาบัตรประชาชนผู้ยืม', required: true },
      { key: 'event_detail', label: 'รายละเอียดงาน/วัตถุประสงค์การใช้', required: true },
      { key: 'item_list', label: 'รายการพัสดุ/ครุภัณฑ์ที่ขอยืม', required: true },
      { key: 'return_date', label: 'กำหนดวันส่งคืน', required: true },
    ],
  },

  // ───── กองสวัสดิการสังคม ─────
  {
    slug: 'funeral-aid',
    name: 'แบบฟอร์มคำร้องขอเงินสงเคราะห์ค่าจัดการศพผู้สูงอายุ (ผส.4)',
    category: 'welfare',
    description:
      'กองสวัสดิการสังคม — สำหรับขอรับเงินสงเคราะห์ค่าจัดการงานศพผู้สูงอายุ/ผู้มีรายได้น้อย ตามระเบียบกระทรวง พม.',
    requiredDocs: [
      { key: 'request_form', label: 'แบบฟอร์มคำร้องที่กรอกแล้ว', required: true },
      { key: 'id_card', label: 'สำเนาบัตรประชาชนผู้ขอ (ทายาท)', required: true },
      { key: 'house_reg', label: 'สำเนาทะเบียนบ้านผู้ขอ', required: true },
      { key: 'death_cert', label: 'สำเนาใบมรณบัตร', required: true },
      { key: 'deceased_id_card', label: 'สำเนาบัตรประชาชนของผู้เสียชีวิต', required: true },
      { key: 'deceased_house_reg', label: 'สำเนาทะเบียนบ้านของผู้เสียชีวิต', required: true },
      { key: 'low_income_cert', label: 'หนังสือรับรองผู้มีรายได้น้อย/ผู้สูงอายุ (ถ้ามี)', required: false },
      { key: 'bank_book', label: 'สำเนาหน้าสมุดบัญชีธนาคารผู้ขอรับเงิน', required: true },
    ],
  },
  {
    slug: 'child-welfare-registration',
    name: 'แบบฟอร์มคำร้องขอเงินอุดหนุนเด็กแรกเกิด (ดร.01/ดร.02)',
    category: 'welfare',
    description: 'กองสวัสดิการสังคม — ลงทะเบียนเพื่อขอรับสิทธิเงินอุดหนุนเพื่อการเลี้ยงดูเด็กแรกเกิด',
    requiredDocs: [
      { key: 'request_form', label: 'แบบ ดร.01/ดร.02 ที่กรอกแล้ว', required: true },
      { key: 'mother_id_card', label: 'สำเนาบัตรประชาชนของมารดา', required: true },
      { key: 'father_id_card', label: 'สำเนาบัตรประชาชนของบิดา (ถ้ามี)', required: false },
      { key: 'child_birth_cert', label: 'สำเนาสูติบัตรของเด็ก', required: true },
      { key: 'child_house_reg', label: 'สำเนาทะเบียนบ้านของเด็ก', required: true },
      { key: 'income_evidence', label: 'หลักฐานรายได้ครอบครัว (ตามเกณฑ์)', required: true },
      { key: 'bank_book', label: 'สำเนาหน้าสมุดบัญชีธนาคาร', required: true },
    ],
  },

  // ───── ทั่วไป ─────
  {
    slug: 'info-request',
    name: 'แบบฟอร์มคำขอข้อมูลข่าวสารของราชการ',
    category: 'general',
    description: 'คำขอเข้าถึงข้อมูลข่าวสารของ อบต. ตาม พ.ร.บ. ข้อมูลข่าวสารของราชการ พ.ศ. 2540',
    requiredDocs: [
      { key: 'request_form', label: 'แบบฟอร์มคำขอข้อมูลข่าวสาร', required: true },
      { key: 'id_card', label: 'สำเนาบัตรประจำตัวประชาชนของผู้ยื่นคำขอ', required: true },
      { key: 'info_subject', label: 'รายละเอียดข้อมูลที่ต้องการ (ระบุชัดเจน)', required: true },
      { key: 'power_of_attorney', label: 'หนังสือมอบอำนาจ (กรณีมอบอำนาจ)', required: false },
    ],
  },
  {
    slug: 'power-of-attorney-form',
    name: 'แบบฟอร์มหนังสือมอบอำนาจทั่วไป',
    category: 'general',
    description: 'แบบฟอร์มหนังสือมอบอำนาจทั่วไปสำหรับใช้ประกอบคำขอ/ติดต่อกับ อบต. แทนผู้มอบอำนาจ',
    requiredDocs: [
      { key: 'attorney_form', label: 'หนังสือมอบอำนาจที่กรอกแล้ว พร้อมอากรแสตมป์ 10 บาท', required: true },
      {
        key: 'attorney_id_house',
        label: 'สำเนาบัตรประชาชน/ทะเบียนบ้าน ของผู้มอบและผู้รับมอบอำนาจ',
        required: true,
      },
    ],
  },
]

async function main() {
  // 0) Load tombstones — slugs that admin deleted; we must not recreate them
  const tombstones = new Set(
    (await prisma.permitTypeTombstone.findMany({ select: { slug: true } })).map(
      (t) => t.slug
    )
  )

  // 1) Remove deprecated/duplicate types (hard-delete only if no requests)
  for (const slug of DEPRECATED_SLUGS) {
    const existing = await prisma.permitType.findUnique({
      where: { slug },
      include: { _count: { select: { requests: true } } },
    })
    if (!existing) continue
    if (existing._count.requests > 0) {
      await prisma.permitType.update({
        where: { slug },
        data: { isActive: false, updatedAt: new Date() },
      })
      console.log(`deactivated (has ${existing._count.requests} requests): ${slug}`)
    } else {
      await prisma.permitType.delete({ where: { slug } })
      console.log(`removed: ${slug}`)
    }
  }

  // 2) Upsert seed types — preserve seed order via sortOrder
  for (let i = 0; i < seeds.length; i++) {
    const s = seeds[i]
    if (tombstones.has(s.slug)) {
      console.log(`skipped (admin deleted): ${s.slug}`)
      continue
    }
    const data = {
      slug: s.slug,
      name: s.name,
      category: s.category,
      sortOrder: i,
      description: s.description,
      requiredDocs: JSON.stringify(s.requiredDocs),
      isActive: true,
      updatedAt: new Date(),
    }
    const exists = await prisma.permitType.findUnique({ where: { slug: s.slug } })
    if (exists) {
      await prisma.permitType.update({ where: { slug: s.slug }, data })
      console.log(`updated: ${s.slug}`)
    } else {
      await prisma.permitType.create({
        data: {
          ...data,
          id: `permit-type-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        },
      })
      console.log(`created: ${s.slug}`)
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
