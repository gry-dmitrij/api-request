# Apirequest

Simple replacement for the axios library

## Use

```
import ApiRequest from 'api-request';

const apiRequest = new ApiRequest()

const params = {
    param1: '1',
    param2: 2
}

const config = {
    responseType: 'arraybuffer',
}
apiRequest.request('get', '/api/url', params, config)
```
