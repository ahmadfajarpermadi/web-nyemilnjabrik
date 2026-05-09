export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#FF8A00',
          cream: '#FFF6E9',
          ink: '#1F2937',
          soft: '#F3F4F6',
          leaf: '#16A34A',
          berry: '#E11D48'
        }
      },
      fontFamily: {
        poppins: ['Poppins', 'Inter', 'sans-serif'],
        inter: ['Inter', 'sans-serif']
      },
      boxShadow: {
        soft: '0 18px 50px rgba(31, 41, 55, 0.10)'
      }
    }
  },
  plugins: []
};
