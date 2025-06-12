import React, { useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext'; // आपकी थीम कॉन्टेक्स्ट यहाँ इंपोर्ट की गई है

const LoadingAnimation = () => {
    // ThemeContext का उपयोग किया जा सकता है, हालाँकि 'R' और सर्कल्स का रंग
    // सीधे कोड में निर्धारित किया गया है जैसा आपने अनुरोध किया था।
    const { theme } = useContext(ThemeContext);

    // 'R' अक्षर और पॉप-आउट होने वाले सर्कल्स के लिए मुख्य नीला रंग
    const mainBlueColor = '#1a73e8';
    // सर्कल्स के लिए पारदर्शी नीला रंग
    const transparentBlueColor = 'rgba(26, 115, 232, 0.5)';

    return (
        // मुख्य कंटेनर जो पूरी स्क्रीन को कवर करता है और लोडर को केंद्र में रखता है
        <div className="flex items-center justify-center min-h-screen bg-transparent">
            {/* CSS स्टाइल्स को यहाँ एम्बेड किया गया है */}
            <style>{`
                /* यह सुनिश्चित करता है कि सभी तत्व अपने पैडिंग और बॉर्डर को अपनी कुल चौड़ाई में शामिल करें */
                * {
                    box-sizing: border-box;
                }

                /* मुख्य लोडर कंटेनर जो R और सर्कल्स को रखता है */
                .loader-container {
                    position: relative; /* R और सर्कल्स को इसके सापेक्ष पोजीशन करने के लिए */
                    width: 120px; /* लोडर के लिए निश्चित चौड़ाई */
                    height: 120px; /* लोडर के लिए निश्चित ऊंचाई */
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                /* एनिमेटेड 'R' अक्षर के लिए स्टाइलिंग */
                .animated-r {
                    position: relative; /* सर्कल्स के ऊपर रखने के लिए */
                    font-size: 4.5rem; /* 'R' का साइज़ */
                    font-weight: 900; /* अतिरिक्त बोल्ड */
                    color: ${mainBlueColor}; /* गहरा नीला रंग */
                    text-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1); /* गहराई के लिए सूक्ष्म टेक्स्ट शैडो */
                    z-index: 2; /* सुनिश्चित करें कि 'R' सर्कल्स के ऊपर हो */
                    will-change: transform; /* स्मूद एनिमेशन के लिए हार्डवेयर त्वरण सक्षम करें */
                    /* 'R' के लिए एक सूक्ष्म पल्स एनिमेशन */
                    animation: pulse-r 2s ease-in-out infinite alternate;
                }

                /* 'R' के पल्स एनिमेशन के लिए Keyframes */
                @keyframes pulse-r {
                    0%, 100% { transform: scale(1); } /* सामान्य आकार */
                    50% { transform: scale(1.03); } /* थोड़ा बड़ा करें */
                }

                /* पॉप-आउट होने वाले सर्कल्स के लिए सामान्य स्टाइलिंग */
                .ripple-circle {
                    position: absolute; /* लोडर कंटेनर के सापेक्ष पोजीशन करें */
                    top: 50%; /* केंद्र से शुरू करें */
                    left: 50%; /* केंद्र से शुरू करें */
                    transform: translate(-50%, -50%); /* अपने केंद्र बिंदु पर पोजीशन करें */
                    background-color: ${transparentBlueColor}; /* गहरा नीला रंग थोड़ी पारदर्शिता के साथ */
                    border-radius: 50%; /* गोल आकार */
                    z-index: 1; /* 'R' के पीछे रखें */
                    animation: ripple-effect 2s infinite ease-out forwards; /* मुख्य रिपल एनिमेशन */
                    will-change: transform, opacity; /* स्मूद एनिमेशन के लिए हार्डवेयर त्वरण सक्षम करें */
                }

                /* 'ripple-effect' एनिमेशन के लिए Keyframes */
                @keyframes ripple-effect {
                    0% {
                        width: 0px; /* छोटे से शुरू करें */
                        height: 0px;
                        opacity: 1; /* पूरी तरह से अपारदर्शी */
                    }
                    100% {
                        width: 120px; /* अधिकतम आकार तक फैलाएं */
                        height: 120px;
                        opacity: 0; /* पूरी तरह से गायब हो जाएं */
                    }
                }

                /* पहले रिपल सर्कल के लिए एनिमेशन में देरी */
                .ripple-circle:nth-child(1) { animation-delay: 0s; }
                /* दूसरे रिपल सर्कल के लिए एनिमेशन में देरी (पहले वाले के बीच में शुरू होता है) */
                .ripple-circle:nth-child(2) { animation-delay: 1s; }

                /* छोटे स्क्रीन (जैसे मोबाइल) के लिए प्रतिक्रियाशील डिज़ाइन */
                @media (max-width: 600px) {
                    .loader-container {
                        width: 100px; /* कंटेनर का आकार छोटा करें */
                        height: 100px;
                    }
                    .animated-r {
                        font-size: 4rem; /* 'R' का आकार और छोटा करें */
                    }
                    @keyframes ripple-effect {
                        0% { width: 0px; height: 0px; opacity: 1; }
                        100% { width: 100px; height: 100px; opacity: 0; } /* रिपल का अधिकतम आकार एडजस्ट करें */
                    }
                }
            `}</style>

            {/* मुख्य लोडर कंटेनर */}
            <div className="loader-container">
                {/* पहला पॉप-आउट होने वाला सर्कल */}
                <div className="ripple-circle"></div>
                {/* दूसरा पॉप-आउट होने वाला सर्कल (पहले वाले के बाद) */}
                <div className="ripple-circle"></div>
                {/* आपका एनिमेटेड 'R' अक्षर */}
                <div className="animated-r">R</div>
            </div>
        </div>
    );
};

export default LoadingAnimation;
