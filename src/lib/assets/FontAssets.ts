type FontAsset = {
  family: string;     // 字體名稱 (例：'Source Han Sans')
  url: string;        // 字體檔案位置
  weight?: string;    // 字重 (例：'400', '700')
  style?: string;     // 字體風格 (例：'normal', 'italic')
};

const fontMap: Record<string, FontAsset> = {
  default: {
    family: 'Noto Sans TC',
    url: '/assets/fonts/NotoSansTC-Regular.ttf',
    weight: '400',
    style: 'normal'
  },
  defaultBold: {
    family: 'Noto Sans TC',
    url: '/assets/fonts/NotoSansTC-Bold.ttf',
    weight: '700',
    style: 'normal'
  },
  title: {
    family: 'Noto Serif TC',
    url: '/assets/fonts/NotoSerifTC-Regular.ttf',
    weight: '400',
    style: 'normal'
  },
  titleBold: {
    family: 'Noto Serif TC',
    url: '/assets/fonts/NotoSerifTC-Bold.ttf',
    weight: '700',
    style: 'normal'
  },
  englishNumberDefault: {
    family: 'Gabarito',
    url: '/assets/fonts/Gabarito-Regular.ttf',
    weight: '400',
    style: 'normal'
  },
  englishNumberBold: {
    family: 'Gabarito',
    url: '/assets/fonts/Gabarito-Bold.ttf',
    weight: '700',
    style: 'normal'
  }
};

export const FontAssets = {
  preload() {
    for (const { family, url, weight, style } of Object.values(fontMap)) {
      const fontFace = new FontFace(family, `url(${url})`, { weight, style });
      document.fonts.add(fontFace);
      fontFace.load();
    }
  },
  getFamily(key: string) {
    return fontMap[key]?.family ?? fontMap.default.family;
  },
  getCssStyle(...keys: string[]) {
    const fonts = keys.map(key => fontMap[key]).filter(Boolean);

    const families = fonts.map(f => `'${f.family}'`).join(', ');
    const weight = fonts[0]?.weight ?? 'normal';
    const style = fonts[0]?.style ?? 'normal';

    return `font-family: ${families}; font-weight: ${weight}; font-style: ${style};`;
    }
};