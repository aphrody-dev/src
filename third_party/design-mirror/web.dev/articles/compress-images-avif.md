---
source_url: https://web.dev/articles/compress-images-avif
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:32+00:00
sha256: c17f5241708cac0958853f4c26ff3d34de94608973326ffeb97b5e90d85a37e7
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

Jai Krishnan Wan-Teh Chang Jeremy Wagner [GitHub](https://github.com/malchata) [LinkedIn](https://www.linkedin.com/in/malchata) [Homepage](https://jlwagner.net/)

We
[frequently write](https://web.dev/explore/fast#optimize-your-images)
about the bloat on websites from images,
and tools like
[Lighthouse](https://web.dev/articles/optimize-vitals-lighthouse.md.txt)
highlight when image loading is having a negative impact on user experience,
such as increasing load time,
or taking bandwidth away from more important resources.
One way to fix this is to use modern compression to reduce the file size of images,
and a new option for web developers is the
[AVIF image format](https://aomediacodec.github.io/av1-avif/).
This blog post talks about recent updates to open source tooling for AVIF,
introduces the libaom and libavif encoding libraries,
and includes a tutorial for using these libraries to encode AVIF images efficiently.

AVIF is an image format based on the AV1 video codec,
and standardized by the
[Alliance for Open Media](https://aomedia.org).
AVIF offers significant compression gains over other image formats like JPEG and WebP.
While the exact savings will depend on the content, encoding settings, and quality target,
[we](https://jakearchibald.com/2020/avif-has-landed/) and
[others](https://netflixtechblog.com/avif-for-next-generation-image-coding-b1d75675fe4)
have seen greater than 50% savings vs. JPEG.
[](https://storage.googleapis.com/web-dev-uploads/image/foR0vJZKULb5AGJExlazy1xYDgI2/kVqh1xli2O6mqKF3fQNx.avif) 1120 by 840 AVIF at 18,769 bytes (click to enlarge) [](https://storage.googleapis.com/web-dev-uploads/image/foR0vJZKULb5AGJExlazy1xYDgI2/Jy0O0q0mLXl668HAo43n.jpeg) 1120 by 840 JPEG at 20,036 bytes (click to enlarge)

Additionally, AVIF adds codec and container support for new image features such as
[High Dynamic Range and Wide Color Gamut](https://w3c.github.io/ColorWeb-CG/),
[film grain synthesis](https://norkin.org/research/film_grain/),
and progressive decoding.

> [!NOTE]
> **Note:** AVIF supports two types of progressive decoding. Spatial scalability can be used to offer a lower resolution image for network constrained users and 'progressively' provide a higher resolution image by sending just the additional data required to fill in the high frequency details. Quality scalability offers a similar progression by steadily improving visual quality with each render.

## What's new

Since landing AVIF support in Chrome M85,
AVIF support in the open source ecosystem has improved on a number of fronts.

### Libaom

[Libaom](https://aomedia.googlesource.com/aom/)
is an open source AV1 encoder and decoder maintained by the companies in the Alliance for Open Media,
and used in many production services at Google and other member companies.
Between the libaom 2.0.0 release---around the same time Chrome added AVIF support---and the recent 3.1.0 release,
there have been significant still image encoding optimizations added to the codebase.
These include:

- Optimizations for multi-threading and tiled encoding.
- 5x reduction in memory usage.
- 6.5x reduction in CPU usage, as shown in the chart below.

Using speed=6, cq-level=18, for 8.1 MP images

These changes massively reduce the cost of encoding AVIF---
particularly the most frequently loaded,
or highest priority images on your site.
As [hardware-accelerated encoding](https://www.cnet.com/news/google-supercharges-youtube-with-a-custom-video-chip/)
of AV1 becomes more available on servers and cloud services,
the cost to create AVIF images will continue to drop.

### Libavif

[Libavif](https://github.com/AOMediaCodec/libavif),
the reference implementation of AVIF,
is an open source AVIF muxer and parser which is used in Chrome for decoding AVIF images.
It can also be used with libaom for creating AVIF images from your existing uncompressed images,
or transcoding from existing web images (JPEG, PNG, etc).

Libavif recently added support for a wider range of encoder settings,
including integration with more advanced libaom encoder settings.
Optimizations in the processing pipeline like fast YUV-to-RGB conversion using libyuv
and premultiplied alpha support further speed up the decoding process.
And finally, support for the all-intra encoding mode newly added in libaom 3.1.0
brings all the libaom improvements mentioned in the above.

> [!NOTE]
> **Note:** [libheif](https://github.com/strukturag/libheif) is another popular open source AVIF muxer and parser, used in [ImageMagick](https://imagemagick.org/), [libvips](https://github.com/libvips/libvips), and the [sharp](https://sharp.pixelplumbing.com/) Node.js module.

## Encoding AVIF images with avifenc

A quick way to experiment with AVIF is
[Squoosh.app](https://squoosh.app/).
Squoosh runs a WebAssembly version of libavif,
and exposes many of the same features as the command line tools.
It's an easy way to compare AVIF to other formats old and new.
There's also a
[CLI version](https://www.npmjs.com/package/@squoosh/cli)
of Squoosh aimed at Node apps.

However, WebAssembly doesn't yet have access to all the performance primitives of CPUs,
so if you want to run libavif at its fastest,
we recommend the command line encoder, avifenc.

To understand how to encode AVIF images,
we will present a tutorial using the
[same source image](https://codelabs.developers.google.com/codelabs/avif/images/happy_dog.jpg)
used in our example above. To start, you will need:

- [Chrome](https://www.google.com/chrome/) version 85 or later
- [cmake](https://cmake.org/)
- [git](https://git-scm.com/)
- [ninja](https://ninja-build.org/)

You will also need to install the development packages for zlib, libpng, and libjpeg.
The commands for the Debian and Ubuntu Linux distributions are:

```bash
sudo apt-get install zlib1g-dev
sudo apt-get install libpng-dev
sudo apt-get install libjpeg-dev
```

### Building command line encoder avifenc

#### 1. Get the code

Check out a release tag of libavif.

```bash
git clone -b v0.9.1 https://github.com/AOMediaCodec/libavif.git
```

#### 2. Change directory to libavif

```bash
cd libavif
```

There are many different ways you can configure avifenc and libavif to build.
You can find more information at [libavif](https://github.com/AOMediaCodec/libavif).
We are going to build avifenc so that it is statically linked to the
AV1 encoder and decoder library, [libaom](https://aomedia.googlesource.com/aom).

#### 3. Get and build libaom

Change to the libavif external dependencies directory.

```bash
cd ext
```

The next command will pull the libaom source code
and build libaom statically.

```bash
./aom.cmd
```

Change directory to libavif.

```bash
cd ..
```

#### 4. Build the command line encoding tool, avifenc

It is a good idea to create a build directory for avifenc.

```bash
mkdir build
```

Change to the build directory.

```bash
cd build
```

Create the build files for avifenc.

```bash
cmake -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=0 -DAVIF_CODEC_AOM=1 -DAVIF_LOCAL_AOM=1 -DAVIF_BUILD_APPS=1 ..
```

Build avifenc.

```bash
make
```

You have successfully built avifenc!

### Understanding the avifenc command line parameters

avifenc uses the command-line structure:

```bash
./avifenc [options] input.file output.avif
```

The basic parameters for avifenc used in this tutorial are:

| avifenc             |                                                           |
| ------------------- | --------------------------------------------------------- |
| --min 0             | Set min quantizer for color to 0                          |
| --max 63            | Set max quantizer for color to 63                         |
| --minalpha 0        | Set min quantizer for alpha to 0                          |
| --maxalpha 63       | Set max quantizer for alpha to 63                         |
| -a end-usage=q      | Set the rate control mode to Constant Quality (Q) mode    |
| -a cq-level=Q       | Set quantize level for both color and alpha to Q          |
| -a color:cq-level=Q | Set quantize level for color to Q                         |
| -a alpha:cq-level=Q | Set quantize level for alpha to Q                         |
| -a tune=ssim        | Tune for SSIM (default is to tune for PSNR)               |
| --jobs J            | Use J worker threads (default: 1)                         |
| --speed S           | Set encoder speed from 0-10 (slowest-fastest. default: 6) |

The cq-level option sets the quantize level (0-63) to control the quality for color or alpha.

> [!NOTE]
> **Note:** You can think of cq-level as the "amount" of quantization, so a lower value yields higher quality

> [!NOTE]
> **Note:** Higher speed settings will run faster, but produce worse compression efficiency and quality. This tutorial uses the default setting of Speed 6, which we recommend as a balance of encode speed, compression efficiency, and quality.

### Create an AVIF image with default settings

The most basic parameters for avifenc to run, are setting the input and output files.

```bash
./avifenc happy_dog.jpg happy_dog.avif
```

We recommend the following command line to encode an image, say at quantize level 18:

```bash
./avifenc --min 0 --max 63 -a end-usage=q -a cq-level=18 -a tune=ssim happy_dog.jpg happy_dog.avif
```

> [!NOTE]
> **Note:** `"--min 0 --max 63 -a end-usage=q -a cq-level=18 -a tune=ssim"` are the recommended settings for AVIF images. If the image has an alpha channel, add `"--minalpha 0 --maxalpha 63"`. To specify different quantize levels for color and alpha, replace `"-a cq-level=18"` with, say, `"-a color:cq-level=18 -a alpha:cq-level=10"`.

Avifenc has a lot of options that will affect both quality and speed.
If you want to see the options and learn more about them just run `./avifenc`

You now have your very own AVIF image!

### Speeding up the encoder

One parameter that may be good to change
depending on how many cores you have on your machine is the `--jobs` parameter.
This parameter sets how many threads avifenc will use to create AVIF images.
Try running this at the command line.

```bash
./avifenc --min 0 --max 63 -a end-usage=q -a cq-level=18 -a tune=ssim --jobs 8 happy_dog.jpg happy_dog.avif
```

This tells avifenc to use 8 threads when creating the AVIF image,
which speeds up AVIF encoding by roughly 5x.

## Effects on Largest Contentful Paint (LCP)

Images are a common candidate for the [Largest Contentful Paint (LCP) metric](https://web.dev/articles/lcp.md.txt). One common recommendation for improving the loading speed of LCP images is to ensure that an image is optimized. By reducing a resource's transfer size, you're improving its _resource load time_ , which is [one of the four key phases](https://web.dev/articles/optimize-lcp.md.txt#3_reduce_resource_load_time) to target when dealing with LCP candidates that are images.

[Using an image CDN](https://web.dev/articles/image-cdns.md.txt) is strongly recommended when optimizing images, as it requires much less effort than setting up image optimization pipelines in your website's build process or manually using encoder binaries to optimize images by hand. However, image CDNs may be cost-prohibitive for some projects. If this is the case for you, consider the following when optimizing with the avifenc encoder:

- Familiarize yourself with [the options the encoder offers](https://github.com/AOMediaCodec/libavif/blob/main/doc/avifenc.1.md). You may find additional savings while still retaining sufficient image quality by experimenting with some of AVIF's available encoding features.
- AVIF provides both lossy and lossless encoding. Depending on an image's contents, one type of encoding may perform better than another. For example, photographs which are normally served as JPEGs will probably do best with lossy encoding, whereas lossless encoding is likely best for images containing simple details or line art normally served as PNG.
- If using a bundler with community support for imagemin, consider using the [imagemin-avif](https://www.npmjs.com/package/imagemin-avif) package to enable your bundler to output AVIF image variants.

By experimenting with AVIF, you may be able to realize an improvement for your website's LCP times in cases where the LCP candidate is an image. For more information on optimizing LCP, read [the guide on optimizing LCP](https://web.dev/articles/optimize-lcp.md.txt).

## Conclusion

Using libaom, libavif and other open source tooling,
you can get the best image quality and performance for your website using AVIF.
The format is still relatively new,
and optimizations and tooling integrations are actively being developed.
If you have questions, comments, or feature requests,
reach out on the
[av1-discuss mailing list](https://groups.google.com/a/aomedia.org/g/av1-discuss),
[AOM GitHub community](https://github.com/AOMediaCodec/community/wiki), and
[AVIF wiki](https://github.com/AOMediaCodec/av1-avif/wiki).
