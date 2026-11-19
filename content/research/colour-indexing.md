One of the reasons humans might need colour constancy is for object recognition. Colour is an obvious distinguishing feature of an object, but without colour descriptors that remain independent of the colour of the incident illumination, colour will be of limited use. We cannot expect to recognize an object based on its collection of colours if those colours vary dramatically with the illumination.

## Colour Indexing

Although colour can be an important feature of an object, it was not until Swain and Ballard’s [[SWAIN91](#ref-SWAIN91)] ***Colour Indexing*** (CI) work that it was shown how useful colour can be in object identification. Their method identifies an object by comparing its colour histogram to the colour histograms of known objects stored in a database of colour histograms. A colour histogram describes an object by the amount of image area each of its colours occupies. An object matches a known model in the database when its distribution of colour areas resembles those of the model. Swain and Ballard’s method works well even though it ignores all geometric and shape information. Recognition based only on colour makes the method invariant to object rotation, translation and deformation.

## Colour Constant Colour Indexing

Swain and Ballard’s colour indexing method does have one significant failing: it is sensitive to changes in the colour of the incident illumination. When the illumination changes, all the colours in the image change. The colours change enough that the colour histograms of an object and its model in the database no longer match.

SFU Computational Vision Lab members Funt and Finlayson [[FUNT95](#ref-FUNT95)] developed a method called ***Colour Constant Colour Indexing*** (CCCI) which uses relative colour rather than absolute colour for indexing. In the CCCI method relative colour is defined by the ratio of colours at nearby pixels. Relative colours are quite stable to changes in illumination because the colours at nearby pixels are influenced by the same illumination so that the ratio of nearby colours factors out most (but not all) of the illumination.

Sensor response (either a camera or the eye) is described by

`eqb:response` (k=1, ..., 3) (1)

where `eq:rho` is the response of the k<sup>th</sup> sensor class, `eq:E` is the spectrum of the incident illumination, `eq:S` is the percent spectral reflectance of the surface and `eq:Rk` is the relative sensitivity function of the k<sup>th</sup> sensor class.

For two nearby pixels, A and B, the ratio of responses for the k<sup>th</sup> sensor type at the two locations is

`eqb:ratio` (2)

where `eq:SA` and `eq:SB` represent the surface reflectance at the scene points corresponding to pixels A and B. While it is tempting to simplify equation (2) by cancelling out `eq:E` on the top and bottom, obviously we cannot legitimately do so in general since `eq:E` appears within the integral. However, experimental evidence shows such ratios are found to be quite illumination independent.

One way that `eq:E` could be cancelled out is if the sensor sensitivity function `eq:R` were extremely narrowband (i.e., the Dirac delta) so that its response was only non-zero at a single wavelength, `eq:lambda0`. By the sifting theorem, (2) then becomes

`eqb:sifted` (3)

in which case the illuminant’s effect can be cancelled out and eliminated.

The idea that narrow band sensors result in illumination independent ratios led Finlayson et. al. [[FINLAY94a](#ref-FINLAY94a)] to consider the general conditions that lead to stable ratios. See the [Sensor Sharpening](/research/sensor-sharpening/) section for a discussion.

Assuming that the sensors are sufficiently narrow band and (3) holds, the ratio of neighbouring pixels will be illumination independent so long as the illumination is not varying spatially between the two pixels. The CCCI algorithm uses these illumination independent ratios representing relative colour in place of Swain and Ballard’s absolute colour.

CCCI histograms the colour ratios in place of the histogramming the absolute colours and then matches ratio histograms instead of colour histograms. In other words, in CCCI the R,G,B colour triplets are replaced by the ratio triplets R<sub>A</sub>/R<sub>B</sub>, G<sub>A</sub>/G<sub>B</sub>, B<sub>A</sub>/B<sub>B</sub> which are then quite stable with respect to changes in illumination colour. These ratio triplets are histogrammed and compared with ratio histograms stored in the database of model objects. For computational efficiency CCCI’s ratios are computed by taking the finite difference approximation to the laplacian applied to the logarithm of the image, which is equivalent to the ratios of neighbouring pixels.

CCCI results with ratio histograms were comparable in object recognition accuracy with those of absolute colour histogram matching. When the illumination was varied, CCCI continued to perform well; whereas, regular colour indexing failed completely. [[FUNT95](#ref-FUNT95)]

**Ratio Colour Histograms Improve Matching Performance Under Varying Illuminants**

| Input Test Image | CI Database Match (Colour Histograms) | CCCI Match (Colour Ratio Histograms) |
| --- | --- | --- |
| ![A shirt printed with "Barcelona 92", photographed under a test light](/research/obj1-test.jpg) | ![The database object colour indexing matched it to: a Tide detergent box](/research/obj1-ci-match.jpg) | ![The database object colour constant colour indexing matched it to: the same shirt](/research/obj1-ccci-match.jpg) |
| ![A Tide Nature detergent box, photographed under a greenish test light](/research/obj2-test.jpg) | ![The database object colour indexing matched it to: a stacking-ring toy](/research/obj2-ci-match.jpg) | ![The database object colour constant colour indexing matched it to: a Tide detergent box](/research/obj2-ccci-match.jpg) |
