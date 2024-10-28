// PatternView.jsx

import React, { useEffect, useState } from 'react';

function PatternView({ patternId }) {
    const [patternData, setPatternData] = useState(null);

    useEffect(() => {
        fetch(`/api/pattern_view?pattern_id=${patternId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            setPatternData(data);
        })
        .catch(error => {
            console.error('Error fetching pattern data:', error);
        });
    }, [patternId]);

    if (!patternData) return <div>Loading...</div>;

    return (
        <div>
            <h1>{patternData.name}</h1>
            <p>{patternData.content}</p>
            {/* Display images */}
            <img src={patternData.front_torso_image} alt="Front Torso" />
            <img src={patternData.back_torso_image} alt="Back Torso" />
            <img src={patternData.left_sleeve_image} alt="Left Sleeve" />
            <img src={patternData.right_sleeve_image} alt="Right Sleeve" />
            {/* Other pattern details */}
        </div>
    );
}
