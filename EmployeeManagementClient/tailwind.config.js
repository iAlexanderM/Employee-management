module.exports = {
	content: [
		'./src/**/*.{html,ts}',
	],
	theme: {
		extend: {
			fontFamily: {
				poppins: ['Poppins', 'Roboto', 'sans-serif'],
			},
			colors: {
				primary: '#4b6cb7',
				danger: '#ef4444',
				muted: '#6b7280',
				bg: '#f5f7fa',
				text: '#111827',
			},
		},
	},
	plugins: [],
};