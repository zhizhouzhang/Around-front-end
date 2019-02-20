import React from 'react';
import { Marker, InfoWindow } from "react-google-maps";
import blueMarkerUrl from '../assets/images/blue-marker.svg';

export class AroundMarker extends React.Component {
    state = {
        isOpen: false
    }

    toggleOpen = () => {
        this.setState((prevState) => ({
            isOpen: !prevState.isOpen
        }));
    }

    render() {
        const { user, url, message, type, location } = this.props.post;
        const isImage = type === "image";
        const icon = isImage ? null : {
            url: blueMarkerUrl,
            scaledSize: new window.google.maps.Size(26, 41)
        };

        return (
            <Marker
                icon={icon}
                position={{ lat: location.lat, lng: location.lon }}
                onMouseOver={isImage ? this.toggleOpen: null}
                onMouseOut={isImage ? this.toggleOpen: null}
                onClick={!isImage ? this.toggleOpen: null}
            >
                {
                    this.state.isOpen ?
                        <InfoWindow onCloseClick={this.toggleOpen}>
                            <div>
                                {
                                    isImage ?
                                        <img src={url} alt={message} className="around-marker-image" /> :
                                        <video src={url} controls className="around-marker-video" />
                                }
                                <p>{`${user}: ${message}`}</p>
                            </div>
                        </InfoWindow> : null
                }

            </Marker>
        );
    }
}