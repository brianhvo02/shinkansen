import { Agency, Calendar, FeedInfo, Route, Translations, TranslationsTableName } from 'gtfs-types';

export const feed_info: FeedInfo[] = [{
    feed_publisher_name: 'NAVITIME JAPAN',
    feed_publisher_url: 'https://www.navitime.co.jp/',
    feed_lang: 'jp',
    feed_start_date: '20231120',
    feed_end_date: '20240219',
    feed_version: '20231120',
    feed_contact_email: 'me@brianhuyvo.com',
    feed_contact_url: 'https://brianhuyvo.com',
    default_lang: 'jp'
}];

export const agency: Agency[] = [
    {
        agency_id: 'jr_central',
        agency_name: '東海旅客鉄道株式会社',
        agency_url: 'https://jr-central.co.jp/',
        agency_timezone: 'Asia/Tokyo'
    },
    {
        agency_id: 'jr_west',
        agency_name: '西日本旅客鉄道株式会社',
        agency_url: 'https://www.westjr.co.jp/',
        agency_timezone: 'Asia/Tokyo'
    },
    {
        agency_id: 'jr_kyushu',
        agency_name: '九州旅客鉄道株式会社',
        agency_url: 'https://www.jrkyushu.co.jp/',
        agency_timezone: 'Asia/Tokyo'
    },
    {
        agency_id: 'jr_east',
        agency_name: '東日本旅客鉄道株式会社',
        agency_url: 'https://www.jreast.co.jp/',
        agency_timezone: 'Asia/Tokyo'
    },
    {
        agency_id: 'jr_hokkaido',
        agency_name: '北海道旅客鉄道株式会社',
        agency_url: 'https://www.jrhokkaido.co.jp/index.html',
        agency_timezone: 'Asia/Tokyo'
    },
];

export const routes: Route[] = [
    {
        route_id: '00000110',
        agency_id: 'jr_central',
        route_short_name: '東海道新幹線',
        route_type: 2,
        route_color: '1153AF'
    },
    {
        route_id: '00000069',
        agency_id: 'jr_west',
        route_short_name: '山陽新幹線',
        route_type: 2,
        route_color: '24197C'
    },
    {
        route_id: '00001017',
        agency_id: 'jr_kyushu',
        route_short_name: '九州新幹線',
        route_type: 2,
        route_color: 'FF0000'
    },
    {
        route_id: '00000185',
        agency_id: 'jr_east',
        route_short_name: '東北新幹線',
        route_type: 2,
        route_color: '41934C'
    },
    {
        route_id: '00001242',
        agency_id: 'jr_hokkaido',
        route_short_name: '北海道新幹線',
        route_type: 2,
        route_color: '9ACD32'
    },
    {
        route_id: '00000122',
        agency_id: 'jr_east',
        route_short_name: '山形新幹線',
        route_type: 2,
        route_color: 'F36221'
    },
    {
        route_id: '00000182',
        agency_id: 'jr_east',
        route_short_name: '秋田新幹線',
        route_type: 2,
        route_color: 'CC00CC'
    },
    {
        route_id: '00000148',
        agency_id: 'jr_east',
        route_short_name: '上越新幹線',
        route_type: 2,
        route_color: 'F58D79'
    },
    {
        route_id: '00001278',
        agency_id: 'jr_west',
        route_short_name: '西九州新幹線',
        route_type: 2,
        route_color: 'EF59A1'
    },
    {
        route_id: '00000177',
        agency_id: 'jr_east',
        route_short_name: '北陸新幹線',
        route_type: 2,
        route_color: '800080'
    },
];

export const translations: Translations[] = [
    {
        table_name: TranslationsTableName.AGENCY,
        field_name: 'agency_name',
        language: 'en',
        translation: 'Central Japan Railway Company',
        record_id: 'jr_central'
    },
    {
        table_name: TranslationsTableName.AGENCY,
        field_name: 'agency_name',
        language: 'en',
        translation: 'West Japan Railway Company',
        record_id: 'jr_west'
    },
    {
        table_name: TranslationsTableName.AGENCY,
        field_name: 'agency_name',
        language: 'en',
        translation: 'Kyushu Railway Company',
        record_id: 'jr_kyushu'
    },
    {
        table_name: TranslationsTableName.AGENCY,
        field_name: 'agency_name',
        language: 'en',
        translation: 'East Japan Railway Company',
        record_id: 'jr_east'
    },
    {
        table_name: TranslationsTableName.AGENCY,
        field_name: 'agency_name',
        language: 'en',
        translation: 'Hokkaido Railway Company',
        record_id: 'jr_hokkaido'
    },
    {
        table_name: TranslationsTableName.ROUTES,
        field_name: 'route_short_name',
        language: 'en',
        translation: 'Tokaido Shinkansen',
        record_id: '00000110'
    },
    {
        table_name: TranslationsTableName.ROUTES,
        field_name: 'route_short_name',
        language: 'en',
        translation: 'San\'yō Shinkansen',
        record_id: '00000069'
    },
    {
        table_name: TranslationsTableName.ROUTES,
        field_name: 'route_short_name',
        language: 'en',
        translation: 'Kyushu Shinkansen',
        record_id: '00001017'
    },
    {
        table_name: TranslationsTableName.ROUTES,
        field_name: 'route_short_name',
        language: 'en',
        translation: 'Tōhoku Shinkansen',
        record_id: '00000185'
    },
    {
        table_name: TranslationsTableName.ROUTES,
        field_name: 'route_short_name',
        language: 'en',
        translation: 'Hokkaido Shinkansen',
        record_id: '00001242'
    },
    {
        table_name: TranslationsTableName.ROUTES,
        field_name: 'route_short_name',
        language: 'en',
        translation: 'Yamagata Shinkansen',
        record_id: '00000122'
    },
    {
        table_name: TranslationsTableName.ROUTES,
        field_name: 'route_short_name',
        language: 'en',
        translation: 'Akita Shinkansen',
        record_id: '00000182'
    },
    {
        table_name: TranslationsTableName.ROUTES,
        field_name: 'route_short_name',
        language: 'en',
        translation: 'Jōetsu Shinkansen',
        record_id: '00000148'
    },
    {
        table_name: TranslationsTableName.ROUTES,
        field_name: 'route_short_name',
        language: 'en',
        translation: 'Nishi Kyushu Shinkansen',
        record_id: '00001278'
    },
    {
        table_name: TranslationsTableName.ROUTES,
        field_name: 'route_short_name',
        language: 'en',
        translation: 'Hokuriku Shinkansen',
        record_id: '00000177'
    },
    {
        table_name: TranslationsTableName.AGENCY,
        field_name: 'agency_url',
        language: 'en',
        translation: 'https://global.jr-central.co.jp/en/',
        record_id: 'jr_central'
    },
    {
        table_name: TranslationsTableName.AGENCY,
        field_name: 'agency_url',
        language: 'en',
        translation: 'https://www.westjr.co.jp/global/en/',
        record_id: 'jr_west'
    },
    {
        table_name: TranslationsTableName.AGENCY,
        field_name: 'agency_url',
        language: 'en',
        translation: 'https://www.jrkyushu.co.jp/english/',
        record_id: 'jr_kyushu'
    },
    {
        table_name: TranslationsTableName.AGENCY,
        field_name: 'agency_url',
        language: 'en',
        translation: 'https://www.jreast.co.jp/multi/en/',
        record_id: 'jr_east'
    },
    {
        table_name: TranslationsTableName.AGENCY,
        field_name: 'agency_url',
        language: 'en',
        translation: 'https://www.jrhokkaido.co.jp/global/',
        record_id: 'jr_hokkaido'
    },
    {
        table_name: TranslationsTableName.FEED_INFO,
        field_name: 'feed_publisher_url',
        language: 'en',
        translation: 'https://japantravel.navitime.com/en/',
        record_id: ''
    },
];

export const calendar: Calendar[] = [
    {
        service_id: 'weekday',
        monday: 1,
        tuesday: 1,
        wednesday: 1,
        thursday: 1,
        friday: 1,
        saturday: 0,
        sunday: 0,
        start_date: '20231120',
        end_date: '20240219'
    },
    {
        service_id: 'saturday',
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 1,
        sunday: 0,
        start_date: '20231120',
        end_date: '20240219'
    },
    {
        service_id: 'holiday',
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 1,
        start_date: '20231120',
        end_date: '20240219'
    }
];
