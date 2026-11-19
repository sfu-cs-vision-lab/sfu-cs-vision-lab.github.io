Colour is a perceptual experience, not a directly measurable physical phenomena. Of course there are underlying physical phenomena creating our experience, but we can experience the same physical phenomenon differently under different circumstances. Similarly we may experience two different physical phenomena as appearing the same. In general, there is no one-to-one mapping between the spectrum of the light reflected into our eyes and the colour as we perceive it.

A fundamental assumption is that humans exhibit colour vision to give us information about the surface properties of objects. The stability and reliability of colour information is important to our understanding of the world. The problem of colour stability arises because the light reaching our eyes from an object is the product of the object's surface reflectance and the spectrum of the light illuminating the object.

```figure
observed-spectra
```

We do not have direct access to the properties of the incident light, so somehow we must estimate them from the light we observe from the object. To make matters worse, our eyes only measure the spectrum at extremely low resolution. Light energy is a continuous phenomenon that the human visual system samples over the wavelength range of approximately 300 - 700 nanometres using three sensors. Thus, the eye's output signal is a discrete triplet of colour values.

```figure
sampled-spectra
```

All commonly used imaging systems, from digital cameras, to scanners and displays, use a similar 3-band colour encoding scheme since their purpose is to provide input to the human visual system. One consequence of this colour encoding scheme is that there are many spectra that can lead to the same triplet of responses. Such spectra are called ***metamers***, and reflect the fact that the relationship between spectra and sensor triplets is many-to-one. We cannot perfectly reconstruct the original spectrum from its reduced counterpart, because information has been lost that cannot be recovered. There is no hope of recovering the precise surface reflectance properties of surfaces in a scene from a 3-band image of that scene. Nor is there any hope of recovering the exact spectrum of the light illuminating the scene. The best that we can expect is a 3-parameter specification of the reflectance and illumination properties.

Another problem is that a change in the illumination can lead to a very different sensor triplet response, even though the surface properties of the illuminated object remain the same. This makes identification of objects using just sensor triplet information unreliable.

## Overview

*From the lab’s home page of the same period.*

Computational Vision can be thought of as enabling computers to use visual information. Like many problems in Artificial Intelligence, it is something people do so easily they barely think about it, but a very complex problem for a machine.

Our primary focus in the Vision Lab at SFU is in understanding colour: How are colours perceived? How can colours be reproduced accurately on different media? In what ways does colour help in understanding images? Understanding colour is a much more difficult problem than most people suspect. Often poor colour rendition results more from our limited understanding of colour perception than it does from limitations of our colour producing devices.

We subscribe to a computational view of colour, namely, that human perception and use of colour can be explored and explained as computations. The fundamental problem of colour is to explain how we see colours as relatively stable despite the fact that the light reflected into our eyes from an object varies dramatically with the light illuminating the object. Colour and computers have become much more intertwined in recent years as colour displays and colour printers have become more affordable. Since colour is a perceptual, not a physical quality, it is crucial to have a good model of how we perceive colour in complex environments if we are to get predictable results from these devices.

Colours are difficult to reproduce correctly, but why? While we have all experienced untrue colour while using home video cameras or viewing prints from a local photofinisher, now we have colour printers frustrating us with colours that look very little like the nice colours we previewed on our LCD display. When the colour does not look right, it is natural to feel that the printer and display are not calibrated properly, and of course perhaps they are not, but that is not the fundamental problem. The fundamental problem stems from the fact that colour reproduction is not a matter of reproducing identical physical phenomena, as it is in the case of sound reproduction in which a similar pattern of sound waves is recreated, but rather a matter of creating perceptual equivalences.

For us to build machines that reproduce colours accurately or to make effective use of colour in robotics requires that we understand human colour perception, and the last decade has produced many interesting new computational theories of colour coming from both computer science and psychology. A central concern of these theories is to describe how colour depends or does not depend on the incident illumination. A coloured surface cannot be seen unless we shine some light on it, but the spectrum of the reflected light depends on the product of the spectrum of the incident light and the surface's reflectance. It is natural to think of a surface's colour as a feature of the surface itself, but the spectrum of the light energy reaching the eye has the two factors of illumination and reflectance confounded into one. In order to determine the true surface properties, the effect of the illumination must be taken into account.
