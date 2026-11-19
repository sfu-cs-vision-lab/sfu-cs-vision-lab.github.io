The idea that narrow band sensors result in illumination independent ratios of adjacent pixel channel values led Computational Vision Lab researchers [[FINLAY94a](#ref-FINLAY94a)] to consider the general conditions that lead to stable ratios.

Consider two adjacent image pixels A and B. The ratio of responses for the k<sup>th</sup> sensor type at the two locations is

`eqb:ratio` (1)

where `eq:SA` and `eq:SB` represent the surface reflectance at the scene points corresponding to pixels A and B. Given the spatial proximity of the two pixels, the impinging illumination `eq:E` will be identical or nearly so. While it is tempting to simplify equation (1) by cancelling out `eq:E` on the top and bottom, obviously we cannot legitimately do so in general since `eq:E` appears within the integral.

However, `eq:E` could be cancelled out is if the sensor sensitivity function `eq:R` were extremely narrowband (i.e., the Dirac delta) so that its response was only non-zero at a single wavelength, `eq:lambda0`. By the sifting theorem, (1) then becomes

`eqb:sifted` (2)

in which case the illuminant’s effect can be cancelled out and eliminated.

Equation (2) incorporates a model of the effects of changing from one scene illumination to another in that it says that the ratio of sensor responses under the two illumination conditions will be identical. Equivalently, we can say that the effect of a changing the illumination can be modelled by a simple scaling of the sensor response.

For example, if the sensor response in kth band under illuminant A is `eq:rhoA` and the response under illuminant B is `eq:rhoB` and their ratio is `eq:K` then

`eqb:scaling` k=1...3 (3)

The same holds, but with different scale factors, for each image band. If we know the sensor responses under A we can predict the sensor responses under B simply by multiplying by the appropriate scale factors without reference to the surface reflectance. Each band is scaled independently of the others so there is no interaction between bands. If we arrange the sensor 3-tuple as a vector then this independence amounts to saying that a change from one illumination to another can be modelled as a simple diagonal matrix transformation.

Independently scaling the image bands in this way to accommodate illumination changes is a very common operation in colour, for example, it is at the heart of von Kries adaptation, but the accuracy of the model is often taken for granted when it should not be, since in the absence of constraints on `eq:E` and `eq:S`, in (2) is only guaranteed to hold for narrowband sensors.

Having very narrow band sensors turns out not to be the only way for ratios to be illumination independent, however. Finlayson et. al. [[FINLAY94a](#ref-FINLAY94a)] form new sensors from linear combinations of the original sensors. The linear transformation creating the new sensors is called a ***spectral sharpening*** transformation because it comes from the original observation that narrow band, or sharpened, sensitivity functions that approximate Dirac delta functions will have illumination independent ratios.

Figure 1 shows the results of sharpening the sensitivity functions of the human cones. Note that while the overlap between the three sensor bands has been reduced, the resulting functions are not very narrow band.

| Sensitivity Functions of Human Cones | Sharpened Sensitivity Functions |
| --- | --- |
| ![Three overlapping cone sensitivity curves, plotted from 0 to 1.2, peaking at short, middle and long wavelengths](/research/human-cones.png "ink") | ![The same three curves after sharpening: narrower peaks, smaller overlap, with small negative lobes down to about -0.1](/research/human-cones-sharpened.png "ink") |

**Figure 1:** The sharpened sensitivity functions are formed as a linear combination of the originals.

Testing with the sharpened sensors has shown that it is possible to attain relatively stable ratios. According to (1), à priori the illumination can only be cancelled when the sensors are extremely narrow band. The fact that stable ratios result when using sharpened (but not strictly narrow band) sensors says something about the illuminations and reflectances that generally arise in the world. If natural illuminations and reflectances were completely unconstrained then the ratios would always be unstable for anything but perfectly narrow sensor sensitivities.

The constraints on illuminations and reflectances can be expressed in terms of finite dimensional models. Principal component analysis reveals that reflectances and illuminations can be described fairly accurately with a smaller number of parameters than one might at first expect. Working with models of a limited number of parameters places constraints on the reflectance and illumination spectra to be considered.

Finlayson et.al [[FINLAY94b](#ref-FINLAY94b)] show that for the case where illumination spectra span only a 3 dimensional space and reflectances span only a 2 dimensional space then it is possible to find a linear transformation of the original sensor sensitivity functions such that sensor response ratios are completely independent of the illumination. Similar results hold for the case of 2 dimensional illuminants and 3 dimensional reflectances.

While such low dimensional models do not model illuminations and reflectances very accurately, these results of Finlayson et. al. define the circumstances under which illumination change can be modelled perfectly by independent scaling of the image bands, or equivalently by a diagonal matrix transformation, even though the sensor sensitivity functions are broad band.

## Sensor Sharpening Strategies

There are several different strategies that can be used to sharpen sensors. One is simply to solve for the transformation that maximizes the amount of positive sensor response within a chosen spectral range. Experiments with different choices for the range, for example 530nm to 580nm versus 500nm to 600nm, result in very similar sharpening transformations. We call this strategy ***sensor based sharpening***, which aims to find the narrowest sensor by squeezing its response into a narrow range.

Since the goal of spectral sharpening is to find sensors for which the ratios of sensor responses remain independent of the illumination, another sharpening strategy is to solve directly for the sensor transformation leading to the most illumination independent ratios. This strategy which we call ***database sharpening*** uses a database of common illuminant and reflectance spectra over which the stability of the ratios is optimized. Database sharpening leads to sharpened sensors closely resembling those of sensor based sharpening.

## Further Research

Lab members are continuing their research into sensor sharpening. Barnard has investigated the effect of sharpened sensors on the performance of colour constancy algorithms [[BARNARD98](#ref-BARNARD98)].
