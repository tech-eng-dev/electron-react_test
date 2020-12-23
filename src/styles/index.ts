import { StyleSheet } from 'aphrodite/no-important';

export default StyleSheet.create({
    loadingContainer: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10000
    },
    error: {
        color: '#fff',
        backgroundColor: 'red',
        padding: 5,
        fontSize: 10
    },
    buttonLink:
    {
        textDecoration: 'none'
    },
    absolute:
    {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff'
    }
});