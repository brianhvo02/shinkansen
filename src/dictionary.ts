export const dictionary: Record<string, string> = {
    'のぞみ': 'Nozomi',
    'ひかり': 'Hikari',
    'こだま': 'Kodama',
    'さくら': 'Sakura',
    'みずほ': 'Mizuho',
    'つばめ': 'Tsubame',
    'なすの': 'Nasuno',
    'やまびこ': 'Yamabiko',
    'はやぶさ': 'Hayabusa',
    'はやて': 'Hayate',
    'つばさ': 'Tsubasa',
    'こまち': 'Komachi',
    'とき': 'Toki',
    'たにがわ': 'Tanigawa',
    'かもめ': 'Kamome',
    'あさま': 'Asama',
    'かがやき': 'Kagayaki',
    'はくたか': 'Hakutaka',
    'つるぎ': 'Tsurugi',
};

export const transferMap = {
    '': [''],
    '00000110': [
        '00004305'
    ],
    '00000069': [
        '00004305',
        '00007420'
    ],
    '00001017': [
        '00007420'
    ],
    '00000185': [
        '00004283',
        '00008031',
        '00004689'
    ],
    '00001242': [
        '00004283'
    ],
    '00000122': [
        '00008031',
    ],
    '00000182': [
        '00004689'
    ]
}

export type RouteId = keyof typeof transferMap;

export enum TransferType {
    RECOMMENDED_TRANSFER_POINT,
    TIMED_TRANSFER_POINT,
    REQUIRE_MINIMUM_TIME,
    NOT_POSSIBLE,
    IN_SEAT,
    ALIGHT_REBOARD
}