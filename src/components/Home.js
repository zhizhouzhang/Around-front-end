import React from 'react';
import { Tabs, Button, Spin } from 'antd';
import { GEO_OPTIONS, POS_KEY, API_ROOT, AUTH_HEADER, TOKEN_KEY } from '../constants';
import { Gallery } from './Gallery';
import { CreatePostButton } from './CreatePostButton';

const TabPane = Tabs.TabPane;

export class Home extends React.Component {
    state = {
        isLoadingGeoLocation: false,
        error: '',
        isLoadingPosts: false,
        posts: []
    }

    componentDidMount() {
        if ('geolocation' in navigator) {
            this.setState({
                isLoadingGeoLocation: true
            });
            navigator.geolocation.getCurrentPosition(
                this.onSuccessLoadGeoLocation,
                this.onFailedLoadGeoLocation,
                GEO_OPTIONS
            );
        } else {
            this.setState({ error: 'Geolocation is not supported.' });
        }
    }

    onSuccessLoadGeoLocation = (position) => {
        const { longitude, latitude } = position.coords;
        localStorage.setItem(POS_KEY, JSON.stringify({
            lat: latitude,
            lon: longitude
        }));
        this.setState({ isLoadingGeoLocation: false, error: '' });
        this.loadNearbyPosts();
    }

    onFailedLoadGeoLocation = (error) => {
        this.setState({
            isLoadingGeoLocation: false,
            error: 'Failed to get geolocation: ' + error.message
        });
    }

    loadNearbyPosts = () => {
        const { lat, lon } = JSON.parse(localStorage.getItem(POS_KEY));
        const token = localStorage.getItem(TOKEN_KEY);

        this.setState({ isLoadingPosts: true, error: '' });

        fetch(`${API_ROOT}/search?lat=${lat}&lon=${lon}&range=20000`, {
            method: 'GET',
            headers: {
                Authorization: `${AUTH_HEADER} ${token}`
            }
        }).then((response) => {
            if (response.ok) {
                return response.json();
            }
            throw new Error(response.statusText);
        }).then((posts) => {
            console.log(posts);
            this.setState({ isLoadingPosts: false, posts: posts || [] });
        }).catch((e) => {
            this.setState({ isLoadingPosts: false, error: e.message });
        });
    }

    getImagePosts = () => {
        const { error, isLoadingGeoLocation, isLoadingPosts, posts } = this.state;
        if (error) {
            return <div>{error}</div>;
        } else if (isLoadingGeoLocation) {
            return <Spin tip="Loading geo location..." />;
        } else if (isLoadingPosts) {
            return <Spin tip="Loading posts..." />;
        } else if (posts && posts.length > 0) {
            return <Gallery images={
                posts.filter(({type}) => type === "video").map(({ user, url, message }) => ({
                    user,
                    src: url,
                    thumbnail: url,
                    caption: message,
                    thumbnailWidth: 400,
                    thumbnailHeight: 300
                }))
            } />;
        } else {
            return <div>No nearby posts.</div>;
        }
    }

    render() {
        const operations = <CreatePostButton loadNearbyPosts={this.loadNearbyPosts} />;

        return (
            <Tabs className="main-tabs" tabBarExtraContent={operations}>
                <TabPane tab="Image Posts" key="1">
                    {this.getImagePosts()}
                </TabPane>
                <TabPane tab="Video Posts" key="2">
                    {this.getImagePosts()}
                </TabPane>
                <TabPane tab="Map" key="3">Content of tab 3</TabPane>
            </Tabs>
        );
    }
}
