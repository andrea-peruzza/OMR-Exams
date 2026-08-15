# starting from an official Linux image with Python 3.10 already installed
FROM python:3.10-slim

# prevent Python from creating .pyc files
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# set the working folder inside the container
WORKDIR /app

# install system programs (Ghostscript, ImageMagick, Perl, TeXLive)
# use texlive-xetex and latexmk because generate.py explicitly requires them
RUN apt-get update && apt-get install -y --no-install-recommends \
    ghostscript \
    imagemagick \
    perl \
    texlive-xetex \
    texlive-latex-extra \
    texlive-lang-italian \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    texlive-pstricks \
    lmodern \
    latexmk \
    libzbar0 \
    libzxing3 \
    && rm -rf /var/lib/apt/lists/*

# fix the ImageMagick policy that blocks PDFs
RUN find /etc/ImageMagick-* -name "policy.xml" -exec \
    sed -i 's/rights="none" pattern="PDF"/rights="read|write" pattern="PDF"/' {} \;

# install the OpenDyslexic font (necessary for xetex/fontspec)
# fontconfig is used to register system fonts
RUN apt-get update && apt-get install -y --no-install-recommends \
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

# The .otf files must be located in ./fonts/ in the repo (same folder as the Dockerfile)
# copy the folder to this address because fontconfig scans /usr/share/fonts/ and subfolders for fonts
COPY fonts/ /usr/share/fonts/truetype/opendyslexic/
RUN fc-cache -f -v

# copy the python dependencies
COPY requirements.txt .

# install the project
RUN pip install --no-cache-dir -r requirements.txt

#and then import the code
COPY . /app

# which door to expose
EXPOSE 5000

# The command that will be launched when the container is powered on
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]