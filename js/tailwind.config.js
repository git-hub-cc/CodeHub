/* js/tailwind.config.js */

tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            typography: (theme) => ({
                DEFAULT: {
                    css: {
                        'code::before': { content: '""' },
                        'code::after': { content: '""' }
                    }
                },
                dark: {
                    css: {
                        color: theme('colors.slate.300'),
                        a: { color: theme('colors.white') },
                        strong: { color: theme('colors.white') },
                        hr: { borderColor: theme('colors.slate.700') },
                        blockquote: {
                            color: theme('colors.slate.400'),
                            borderLeftColor: theme('colors.slate.700')
                        },
                        h1: { color: theme('colors.white') },
                        h2: { color: theme('colors.white') },
                        h3: { color: theme('colors.white') },
                        h4: { color: theme('colors.white') },
                        code: { color: theme('colors.white') },
                        pre: {
                            color: theme('colors.slate.200'),
                            backgroundColor: theme('colors.slate.800')
                        },
                        thead: {
                            color: theme('colors.white'),
                            borderBottomColor: theme('colors.slate.600')
                        },
                        'tbody tr': {
                            borderBottomColor: theme('colors.slate.700')
                        }
                    }
                }
            })
        }
    },
}