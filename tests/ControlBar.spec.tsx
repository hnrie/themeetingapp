
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ControlBar from '../components/ControlBar';

describe('ControlBar', () => {
  it('should have the correct aria-labels', () => {
    const { getByLabelText } = render(
      <ControlBar
        isMicOn={true}
        isCameraOn={true}
        isScreenSharing={false}
        isSidebarOpen={false}
        onToggleMic={() => {}}
        onToggleCamera={() => {}}
        onToggleScreenShare={() => {}}
        onToggleSidebar={() => {}}
        onToggleSettings={() => {}}
        onLeave={() => {}}
      />
    );

    expect(getByLabelText('Mute microphone')).toBeInTheDocument();
    expect(getByLabelText('Turn off camera')).toBeInTheDocument();
    expect(getByLabelText('Share screen')).toBeInTheDocument();
    expect(getByLabelText('Leave meeting')).toBeInTheDocument();
  });
});
