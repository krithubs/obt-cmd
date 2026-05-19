const phuyaiKhaki = {
  50: '#FBF5E8',
  100: '#F5E6CC',
  200: '#E8D4A8',
  300: '#D4B896',
  400: '#B89968',
  500: '#8B7048',
  600: '#5D4A30',
  700: '#5D4A35',
  800: '#3A2D1E',
  900: '#21180F',
}

const phuyaiBrown = {
  50: '#FBF5E8',
  100: '#EFEAE2',
  200: '#E8D7BC',
  300: '#D4B896',
  400: '#B89968',
  500: '#9B8268',
  600: '#8B7048',
  700: '#5D4A35',
  800: '#3A2D1E',
  900: '#21180F',
}

const phuyaiSage = {
  50: '#F6FAEF',
  100: '#EAF3DE',
  200: '#D6E9C2',
  300: '#BBD995',
  400: '#9BCC68',
  500: '#7CB342',
  600: '#669B37',
  700: '#558B2F',
  800: '#3D6423',
  900: '#2C491A',
}

const phuyaiWarm = {
  50: '#FBF5E8',
  100: '#F5EAD6',
  200: '#E8D7BC',
  300: '#E8D4A8',
  400: '#D4B896',
  500: '#B89968',
  600: '#9B8268',
  700: '#8B7048',
  800: '#5D4A35',
  900: '#3A2D1E',
}

const phuyaiInk = {
  50: '#FBF5E8',
  100: '#F5EAD6',
  200: '#E8D7BC',
  300: '#D4B896',
  400: '#B8A98E',
  500: '#8B7763',
  600: '#5D4A35',
  700: '#5D4A30',
  800: '#3A2D1E',
  900: '#21180F',
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: phuyaiKhaki,
        khaki: phuyaiKhaki,
        wisdom: phuyaiBrown,
        sage: phuyaiSage,
        cream: phuyaiWarm,
        ink: phuyaiInk,
        brand: {
          cream: '#F5EAD6',
          surface: '#FBF5E8',
          primary: '#D4B896',
          primaryDark: '#5D4A30',
          brown: '#5D4A35',
          heading: '#3A2D1E',
          muted: '#8B7763',
          disabled: '#B8A98E',
          success: '#7CB342',
        },
        blue: phuyaiKhaki,
        sky: phuyaiKhaki,
        indigo: phuyaiBrown,
        purple: phuyaiBrown,
        violet: phuyaiBrown,
        gray: phuyaiInk,
        slate: phuyaiInk,
        zinc: phuyaiInk,
        neutral: phuyaiInk,
        stone: phuyaiInk,
        green: phuyaiSage,
        emerald: phuyaiSage,
        amber: phuyaiWarm,
        orange: phuyaiWarm,
        yellow: phuyaiWarm,
      },
    },
  },
  plugins: [],
}
